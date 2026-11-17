// Mitigation levers (SPECIFICATIONS §4.3, §7B.1). Each lever transforms a copy of the inputs;
// compareLevers reports Δ exposure, Δ cost and Δ schedule per original build wave.
import { COST_MODEL, GENERATIONS } from "../model/config";
import type { BuildWave, DateStr, Entity, OpticsForm, PartsDataset, Status } from "../model/types";
import { addMonths, monthsBetween } from "./dates";
import { evaluate, severityIndex, waveTenants, type EvalInput } from "./evaluate";

export type Lever =
  | { kind: "SWAP_SUPPLIER"; line_id: string; alternate_id: string; wave_id?: string }
  | { kind: "SHIFT_GENERATION"; wave_id: string; gbps: number }
  | { kind: "CHANGE_OPTICS_FORM"; wave_id: string; form: OpticsForm }
  | { kind: "PULL_FORWARD"; wave_id: string; line_id: string; qty: number; by_date: DateStr }
  | { kind: "RAISE_US_CONTENT"; line_id: string; dsp_src?: string; laser_src?: string; wave_id?: string }
  | { kind: "FEDERAL_ENCLAVE"; wave_id: string; federal_share: number }
  | { kind: "SEEK_CONDITIONAL_APPROVAL"; line_id: string; assumed_grant: DateStr; term_months: number }
  | { kind: "TENANT_CAP"; tenant_id: string; max_gpu_hours: number }
  | { kind: "OFFBOARD_TENANT"; tenant_id: string; date: DateStr }
  | { kind: "RELOCATE_WAVE"; wave_id: string; site_country: string; operator_hq_country?: string }
  | { kind: "APPLY_VEU"; wave_id: string; assumed_approval_date: DateStr };

export interface LeverApplication { input: EvalInput; notes: string[] }

const FEDERAL_BLOCKS: Status[] = ["BLOCKED_FEDERAL", "BLOCKED_DOD"];

export function applyLevers(input: EvalInput, levers: Lever[]): LeverApplication {
  const dataset: PartsDataset = structuredClone(input.dataset);
  let waves: BuildWave[] = structuredClone(input.waves);
  const notes: string[] = [];
  const wave = (id: string) => {
    const w = waves.find((x) => x.id === id);
    if (!w) throw new Error(`No build wave "${id}".`);
    return w;
  };
  const moveQty = (w: BuildWave, from: string, to: string, qty?: number) => {
    const have = w.quantities[from] ?? 0;
    const n = Math.min(have, qty ?? have);
    if (!n) return 0;
    w.quantities[from] = have - n;
    if (!w.quantities[from]) delete w.quantities[from];
    w.quantities[to] = (w.quantities[to] ?? 0) + n;
    return n;
  };
  const targets = (waveId?: string) => (waveId ? [wave(waveId)] : waves);

  for (const lv of levers) {
    switch (lv.kind) {
      case "SWAP_SUPPLIER": {
        if (!dataset.parts[lv.alternate_id]) throw new Error(`No part "${lv.alternate_id}".`);
        for (const w of targets(lv.wave_id)) moveQty(w, lv.line_id, lv.alternate_id);
        notes.push(`Swapped ${lv.line_id} for ${lv.alternate_id}${lv.wave_id ? ` in ${lv.wave_id}` : ""}.`);
        break;
      }
      case "SHIFT_GENERATION": {
        const w = wave(lv.wave_id);
        const from = w.optics_generation_gbps;
        for (const id of Object.keys(w.quantities)) {
          const p = dataset.parts[id];
          if (!p || p.category !== "OPTICAL_TRANSCEIVER") continue;
          const twin = Object.values(dataset.parts).find((q) => q.category === p.category && q.brand === p.brand &&
            q.form_factor === p.form_factor && q.generation_gbps === lv.gbps);
          if (twin) moveQty(w, id, twin.id);
          else notes.push(`${id}: no ${lv.gbps}G model from ${p.brand}; left unchanged.`);
        }
        w.optics_generation_gbps = lv.gbps;
        const a = GENERATIONS[from], b = GENERATIONS[lv.gbps];
        if (a && b) {
          notes.push(`${w.id}: ${from}G → ${lv.gbps}G. Per port: ${a.watts_per_port} W → ${b.watts_per_port} W, ` +
            `${a.gbps_per_port} → ${b.gbps_per_port} Gb/s, so the same fabric bandwidth needs ${(a.gbps_per_port / b.gbps_per_port).toFixed(2)}× the ports.`);
        }
        break;
      }
      case "CHANGE_OPTICS_FORM": {
        const w = wave(lv.wave_id);
        notes.push(`${w.id}: optics form ${w.optics_form} → ${lv.form}.${lv.form === "CPO" ? " Switches now inherit optics exposure." : ""}`);
        w.optics_form = lv.form;
        break;
      }
      case "PULL_FORWARD": {
        const w = wave(lv.wave_id);
        const p = dataset.parts[lv.line_id];
        const n = Math.min(lv.qty, w.quantities[lv.line_id] ?? 0);
        if (!p || !n) { notes.push(`PULL_FORWARD: ${lv.line_id} is not in ${lv.wave_id}.`); break; }
        w.quantities[lv.line_id] -= n;
        const months = Math.max(0, monthsBetween(lv.by_date, w.procurement_date));
        const carry = n * p.unit_cost_usd * COST_MODEL.carrying_cost_per_month * months;
        waves.push({
          ...structuredClone(w), id: `${w.id}-PF`, name: `${w.name} (pulled forward)`, procurement_date: lv.by_date,
          quantities: { [lv.line_id]: n }, tenants: [], parent_wave_id: w.id, lever_costs_usd: carry, lever_schedule_weeks: 0,
        });
        notes.push(`Buys ${n} × ${lv.line_id} on ${lv.by_date}, ${months} months early. Carrying cost $${Math.round(carry).toLocaleString("en-US")}; obsolescence risk not priced.`);
        break;
      }
      case "RAISE_US_CONTENT": {
        const src = dataset.parts[lv.line_id];
        if (!src) throw new Error(`No part "${lv.line_id}".`);
        const newId = `${lv.line_id}+USC`;
        const subs: Record<string, string> = { dsp: lv.dsp_src ?? "US-SRC-DSP", laser: lv.laser_src ?? "ENT-COHERENT" };
        ensureEntity(dataset, subs.dsp, "US-fabbed DSP source (assumed)");
        ensureEntity(dataset, subs.laser, "US laser fab (assumed)");
        let added = 0;
        for (const e of dataset.edges.filter((x) => x.parent_node_id === lv.line_id)) {
          const replace = subs[e.component_role];
          const child = replace ?? e.child_node_id;
          if (replace && dataset.entities[e.child_node_id]?.production_country !== "USA" && dataset.entities[replace]?.production_country === "USA") {
            added += e.value_share_est ?? 0;
          }
          dataset.edges.push({ ...e, parent_node_id: newId, child_node_id: child, evidence_grade: replace ? "C3" : e.evidence_grade });
        }
        const s = src.us_bom_value_share;
        dataset.parts[newId] = {
          ...structuredClone(src), id: newId, sku: `${src.sku}-USC`, is_new_model: true,
          fcc_auth: { fcc_id: null, grant_date: null, conditional_approval_expiry: null },
          unit_cost_usd: Math.round(src.unit_cost_usd * (1 + COST_MODEL.us_content_unit_cost_uplift)),
          lead_time_weeks: src.lead_time_weeks + COST_MODEL.us_content_lead_time_weeks,
          us_bom_value_share: {
            estimate: round(Math.min(1, s.estimate + added)),
            low: round(Math.min(1, s.low + added * 0.85)),
            high: round(Math.min(1, s.high + added * 1.1)),
            basis: `${s.basis}; plus assumed US-sourced DSP and laser (+${Math.round(added * 100)} pts, ±15%)`,
          },
          alternates: [],
        };
        for (const w of targets(lv.wave_id)) moveQty(w, lv.line_id, newId);
        notes.push(`${newId}: US BOM value ${pct(s.estimate)} → ${pct(dataset.parts[newId].us_bom_value_share.estimate)} ` +
          `(range ${pct(dataset.parts[newId].us_bom_value_share.low)}–${pct(dataset.parts[newId].us_bom_value_share.high)}).`);
        break;
      }
      case "FEDERAL_ENCLAVE": {
        const w = wave(lv.wave_id);
        const share = Math.min(1, Math.max(0, lv.federal_share));
        const split = (f: number) => Object.fromEntries(Object.entries(w.quantities).map(([k, v]) => [k, Math.round(v * f)]).filter(([, v]) => (v as number) > 0));
        const tenantIds = waveTenants(dataset, w).map((t) => t.id);
        const com: BuildWave = { ...structuredClone(w), id: `${w.id}-COM`, name: `${w.name} (commercial)`, customer_segment: "COMMERCIAL",
          quantities: split(1 - share), tenants: tenantIds, parent_wave_id: w.id };
        const fed: BuildWave = { ...structuredClone(w), id: `${w.id}-FED`, name: `${w.name} (federal enclave)`,
          customer_segment: w.customer_segment === "COMMERCIAL" ? "FEDERAL_NSS" : w.customer_segment,
          quantities: split(share), tenants: [], parent_wave_id: w.id,
          lever_costs_usd: (w.lever_costs_usd ?? 0) + COST_MODEL.enclave_fixed_cost_usd,
          lever_schedule_weeks: (w.lever_schedule_weeks ?? 0) + COST_MODEL.enclave_schedule_weeks };
        // Re-source the federal pool: test each exposed line against the horizon end so later transitions count.
        const horizonEnd = input.scenarios.map((s) => s.bundle.scenario.horizon.end).sort().at(-1) ?? fed.procurement_date;
        const probe = (q: Record<string, number>) => evaluate({ ...input, dataset, waves: [{ ...fed, quantities: q }], date: horizonEnd });
        for (const id of Object.keys(fed.quantities)) {
          const exposed = probe({ [id]: 1 }).some((x) => x.hits.some((h) => FEDERAL_BLOCKS.includes(h.status)));
          if (!exposed) continue;
          const alt = dataset.parts[id]?.alternates.find((a) => dataset.parts[a] &&
            !probe({ [a]: 1 }).some((x) => x.hits.some((h) => FEDERAL_BLOCKS.includes(h.status))));
          if (alt) { moveQty(fed, id, alt); notes.push(`${fed.id}: ${id} re-sourced to ${alt} for the federal pool.`); }
          else notes.push(`${fed.id}: no clean alternate for ${id}.`);
        }
        waves = waves.flatMap((x) => (x.id === w.id ? [com, fed] : [x]));
        notes.push(`${w.id} split ${Math.round((1 - share) * 100)}/${Math.round(share * 100)} into commercial and federal sub-waves.`);
        break;
      }
      case "SEEK_CONDITIONAL_APPROVAL": {
        const p = dataset.parts[lv.line_id];
        if (!p) throw new Error(`No part "${lv.line_id}".`);
        p.fcc_auth = { ...p.fcc_auth, conditional_approval_expiry: addMonths(lv.assumed_grant, lv.term_months), conditional_approval_assumed: true };
        notes.push(`${p.id}: assumed Conditional Approval ${lv.assumed_grant} to ${p.fcc_auth.conditional_approval_expiry}.`);
        break;
      }
      case "TENANT_CAP": {
        const t = dataset.tenants[lv.tenant_id];
        if (!t) throw new Error(`No tenant "${lv.tenant_id}".`);
        t.monthly_gpu_hours = Math.min(t.monthly_gpu_hours, lv.max_gpu_hours);
        notes.push(`${t.id}: capped at ${lv.max_gpu_hours.toLocaleString("en-US")} GPU-hours per month.`);
        break;
      }
      case "OFFBOARD_TENANT": {
        const t = dataset.tenants[lv.tenant_id];
        if (!t) throw new Error(`No tenant "${lv.tenant_id}".`);
        t.offboard_date = lv.date;
        notes.push(`${t.id}: offboarded from ${lv.date}.`);
        break;
      }
      case "RELOCATE_WAVE": {
        const w = wave(lv.wave_id);
        notes.push(`${w.id}: site ${w.site_country} → ${lv.site_country}${lv.operator_hq_country ? `, operator HQ ${w.operator_hq_country} → ${lv.operator_hq_country}` : ""}.`);
        w.site_country = lv.site_country;
        if (lv.operator_hq_country) w.operator_hq_country = lv.operator_hq_country;
        w.lever_costs_usd = (w.lever_costs_usd ?? 0) + COST_MODEL.relocate_fixed_cost_usd;
        w.lever_schedule_weeks = (w.lever_schedule_weeks ?? 0) + COST_MODEL.relocate_schedule_weeks;
        break;
      }
      case "APPLY_VEU": {
        const w = wave(lv.wave_id);
        w.veu_assumed_date = lv.assumed_approval_date;
        notes.push(`${w.id}: validated end-user authorization assumed from ${lv.assumed_approval_date}.`);
        break;
      }
    }
  }
  return { input: { ...input, dataset, waves }, notes };
}

export interface WaveDelta {
  wave_id: string;
  before: { risk: number; cost_usd: number; schedule_weeks: number; worst: Status };
  after: { risk: number; cost_usd: number; schedule_weeks: number; worst: Status };
  delta_risk: number;
  delta_cost_usd: number;
  delta_schedule_weeks: number;
}

export interface LeverReport { waves: WaveDelta[]; notes: string[] }

export function compareLevers(input: EvalInput, levers: Lever[]): LeverReport {
  const applied = applyLevers(input, levers);
  const before = rollup(input);
  const after = rollup(applied.input);
  const ids = [...new Set([...before.keys(), ...after.keys()])];
  return {
    notes: applied.notes,
    waves: ids.map((id) => {
      const b = before.get(id) ?? empty(), a = after.get(id) ?? empty();
      return { wave_id: id, before: b, after: a, delta_risk: round(a.risk - b.risk), delta_cost_usd: a.cost_usd - b.cost_usd,
        delta_schedule_weeks: a.schedule_weeks - b.schedule_weeks };
    }),
  };
}

function rollup(input: EvalInput) {
  const out = new Map<string, WaveDelta["before"]>();
  const exposures = evaluate(input);
  for (const w of input.waves) {
    const root = w.parent_wave_id ?? w.id;
    const cur = out.get(root) ?? empty();
    let cost = w.lever_costs_usd ?? 0, weeks = 0;
    for (const [id, q] of Object.entries(w.quantities)) {
      const p = input.dataset.parts[id];
      if (!p || q <= 0) continue;
      cost += q * p.unit_cost_usd;
      weeks = Math.max(weeks, p.lead_time_weeks);
    }
    weeks += w.lever_schedule_weeks ?? 0;
    const ex = exposures.filter((e) => e.build_wave_id === w.id);
    const worst = ex.reduce<Status>((s, e) => (severityIndex(e.status) > severityIndex(s) ? e.status : s), cur.worst);
    out.set(root, {
      risk: round(cur.risk + ex.reduce((s, e) => s + e.weighted_risk, 0)),
      cost_usd: cur.cost_usd + Math.round(cost),
      schedule_weeks: Math.max(cur.schedule_weeks, weeks),
      worst,
    });
  }
  return out;
}

const empty = (): WaveDelta["before"] => ({ risk: 0, cost_usd: 0, schedule_weeks: 0, worst: "CLEAR" });
const round = (v: number) => Math.round(v * 1000) / 1000;
const pct = (v: number) => `${Math.round(v * 100)}%`;

function ensureEntity(d: PartsDataset, id: string, name: string) {
  if (d.entities[id]) return;
  const e: Entity = { node_id: id, name, sayari_entity_id: "", country_of_incorporation: "USA", production_country: "USA",
    owner_chain_summary: "Assumed by lever", list_flags: [] };
  d.entities[id] = e;
}
