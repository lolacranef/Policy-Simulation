import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ActiveRule } from "../engine/branches";
import type { SupplyGraph } from "../engine/graph";
import type { LeverReport } from "../engine/levers";
import type { EvalInput } from "../engine/evaluate";
import type { BuildWave, DateStr, EvidenceGrade, Exposure, ProductCategory, RuleHit, ScenarioBundle, Source } from "../model/types";
import { DeltaBars, ExposureOverTime, Swimlanes, WaveBars, type MonthCounts } from "./charts";
import { Guilloche, Rule } from "./ornament";
import {
  BRANCH_PLAIN, PRODUCT_EXPLAINED, ROLE_PLAIN, CATEGORY_HELP, CATEGORY_PLAIN, CONTEXT_PLAIN, country, FLAG_PLAIN, LEGAL_PLAIN, RULE_EXPLAINED, RULE_PLAIN, RULE_SHORT, SCENARIO_PLAIN, SEGMENT_PLAIN, sureness,
} from "./plain";
import { BUCKETS, BUCKET_LABEL, bucketOf, CATEGORY_LABEL, Chip, monthLabel } from "./shared";

export type TabId = "overview" | "rules" | "parts" | "matrix" | "timeline" | "levers" | "tenants" | "evidence" | "words";

export interface Model {
  input: EvalInput;
  exposures: Exposure[];
  report: LeverReport | null;
  rules: ActiveRule[];
  bundles: ScenarioBundle[];
  graph: SupplyGraph;
  branchNames: string[];
  date: DateStr | null;
  selected: string | null;
  select: (key: string | null) => void;
  go: (tab: TabId) => void;
}

const CATEGORY_ORDER = Object.keys(CATEGORY_LABEL) as ProductCategory[];
const rank = (e: Exposure) => BUCKETS.indexOf(bucketOf(e.status));
const waveName = (m: Model, id: string) => m.input.waves.find((w) => w.id === id)?.name ?? id;

function PageHead({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <header className="pagehead">
      <Guilloche className="pagehead-pattern" lines={18} h={240} />
      <div className="wrap pagehead-in">
        <span className="kicker">{kicker}</span>
        <h1 className="display">{title}</h1>
        <div className="intro">{children}</div>
      </div>
    </header>
  );
}

export function Sureness({ g }: { g: EvidenceGrade }) {
  const s = sureness(g);
  return (
    <span className="sure" title={s.why}>
      <span className="sure-bars" aria-hidden="true">{[1, 2, 3, 4].map((i) => <i key={i} className={i <= s.level ? "on" : ""} />)}</span>
      {s.label}
    </span>
  );
}

// ================================================================ Start here

export interface TourStep { title: string; body: string; cta: string; run: () => void }

export function Overview({ m, tour }: { m: Model; tour: TourStep[] }) {
  const rows = m.exposures;
  const counts = Object.fromEntries(BUCKETS.map((b) => [b, rows.filter((e) => bucketOf(e.status) === b).length])) as Record<string, number>;
  const top = rows.filter((e) => e.status !== "CLEAR").sort((a, b) => rank(a) - rank(b) || b.weighted_risk - a.weighted_risk).slice(0, 6);
  const first = rows.filter((e) => bucketOf(e.status) === "block").sort((a, b) => a.date.localeCompare(b.date))[0];
  const risk = new Map<string, number>();
  for (const e of rows) risk.set(e.build_wave_id, (risk.get(e.build_wave_id) ?? 0) + e.weighted_risk);
  const worst = [...risk.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <section className="heroband">
        <Guilloche className="hero-pattern" />
        <div className="wrap hero-in">
          <span className="kicker">Regulatory horizon scanning for data centers · intelligence as of 16 November 2026</span>
          <h1 className="display hero-brand">Chokepoint</h1>
          <h2 className="display hero-title">If tomorrow's rules arrived today,<br />what could we still build?</h2>
          <p className="hero-lede">
            Data-center build plans typically meet supply-chain regulation only once a rule is final and hardware is already on order.
            Chokepoint reverses that sequence. It codifies regulatory intelligence at any stage of maturity, from a leaked draft to an
            enacted order, and evaluates it against a bill of materials, its supplier and ownership graph, and a phased deployment
            schedule. Every result carries the provenance and confidence of the evidence <em>behind</em> it.
          </p>
          <div className="hero-cta">
            <button className="btn primary" onClick={tour[0].run}>Begin the guided walkthrough</button>
            <button className="btn" onClick={() => m.go("matrix")}>Open the exposure matrix</button>
          </div>
        </div>
      </section>

      <div className="wrap view">
        <section className="steps" aria-label="How it works">
          <div><span className="step-n">1</span><h3>Codify the intelligence</h3><p>Select a scenario and case. Each encodes regulatory actions by legal status (enacted, proposed, reported, rumored) with an assigned likelihood.</p></div>
          <div><span className="step-n">2</span><h3>Evaluate the supply graph</h3><p>Every BOM line item in every deployment phase is tested against each active rule on the relevant date, traversing component, ownership and affiliate edges.</p></div>
          <div><span className="step-n">3</span><h3>Test mitigations</h3><p>Apply sourcing, architecture and contractual mitigations and compare the resulting changes in exposure, cost and schedule.</p></div>
        </section>

        <Rule />

        <section className="answer">
          <div>
            <span className="kicker">Current assessment</span>
            <h2 className="display">{rows.length ? `${counts.block} of ${rows.length} line items barred` : "No scenario loaded"}</h2>
            <p className="lede">
              {rows.length === 0 ? "Load a scenario in the bar above to evaluate exposure." : <>
                Under the <b>{m.branchNames.join(" and ")}</b> cases, {counts.block} BOM line items or tenants are barred and {counts.lic} require
                a license; {counts.watch} warrant monitoring.{" "}
                {first && <>Exposure first materializes in <b>{monthLabel(first.date)}</b> ({first.build_wave_id}). </>}
                {worst && worst[1] > 0 && <>Aggregate likelihood-weighted risk is highest in <b>{worst[0]} · {waveName(m, worst[0])}</b>.</>}
              </>}
            </p>
          </div>
          <div className="tiles">
            {BUCKETS.map((b) => (
              <button key={b} className="tile" onClick={() => m.go("matrix")}>
                <span className="tile-k"><i className={`sw sw-${b}`} />{BUCKET_LABEL[b]}</span>
                <span className="tile-n">{counts[b]}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid-2">
          <section className="card">
            <header className="card-h"><h2>Exposure by deployment phase</h2><p>Status distribution of BOM line items and tenants in each deployment phase. Select a phase to open it in the matrix.</p></header>
            <WaveBars waves={m.input.waves} exposures={rows} onPick={(id) => { sessionWave.current = id; m.go("matrix"); }} />
          </section>
          <section className="card">
            <header className="card-h"><h2>Guided walkthrough</h2><p>Five reproducible demonstrations drawn from the acceptance cases.</p></header>
            <ol className="tour">
              {tour.map((s, i) => (
                <li key={i}>
                  <span className="step-n small">{i + 1}</span>
                  <div><b>{s.title}</b><p>{s.body}</p></div>
                  <button className="btn" onClick={s.run}>{s.cta}</button>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="card">
          <header className="card-h"><h2>Highest-priority exposures</h2><p>Ranked by severity, then by likelihood-weighted risk. Select one for its audit trail.</p></header>
          {top.length === 0 ? <p className="muted">No exposure under the selected cases.</p> : (
            <div className="toplist">
              {top.map((e) => {
                const lead = e.hits.find((h) => h.status === e.status);
                const subject = e.bom_line_id ? m.input.dataset.parts[e.bom_line_id] : null;
                return (
                  <button key={e.key} className="toprow" onClick={() => { m.select(e.key); m.go(e.row_kind === "TENANT" ? "tenants" : "matrix"); }}>
                    <span><b>{subject ? CATEGORY_PLAIN[subject.category] : "Tenant"}</b><span className="code">{e.bom_line_id ?? e.tenant_id}</span></span>
                    <span className="muted">{waveName(m, e.build_wave_id)} · {monthLabel(e.date)}</span>
                    <Chip status={e.status} />
                    <span className="muted">{lead ? RULE_SHORT[lead.rule_id] ?? lead.rule_id : ""}</span>
                    {lead && <Sureness g={lead.evidence} />}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

/** Building picked from the overview chart, read once by the parts check. */
export const sessionWave: { current: string | null } = { current: null };

// ================================================================ Parts check

export function MatrixView({ m }: { m: Model }) {
  const [wave, setWave] = useState<string>(() => { const w = sessionWave.current; sessionWave.current = null; return w ?? "ALL"; });
  const [onlyExposed, setOnlyExposed] = useState(false);
  const parts = m.input.dataset.parts;
  const waves = m.input.waves.filter((w) => wave === "ALL" || w.id === wave || w.parent_wave_id === wave);
  const byKey = useMemo(() => new Map(m.exposures.map((e) => [e.key, e])), [m.exposures]);
  let ids = [...new Set(waves.flatMap((w) => Object.keys(w.quantities).filter((k) => w.quantities[k] > 0)))].filter((id) => parts[id]);
  if (onlyExposed) ids = ids.filter((id) => waves.some((w) => { const e = byKey.get(`${w.id}|${id}`); return e && e.status !== "CLEAR"; }));
  ids.sort((a, b) => CATEGORY_ORDER.indexOf(parts[a].category) - CATEGORY_ORDER.indexOf(parts[b].category) || a.localeCompare(b, "en", { numeric: true }));
  const roots = [...new Set(m.input.waves.map((w) => w.parent_wave_id ?? w.id))];
  let lastCat: ProductCategory | null = null;

  return (
    <>
      <PageHead kicker="Exposure matrix" title="BOM line item × deployment phase">
        <p>Each cell evaluates one BOM line item in one deployment phase against all active rules at the as-of date, by default the phase's procurement date. The status is the most severe rule outcome after carve-outs. The indicator beneath it reports evidentiary confidence: the weakest link across legal status, source grade and supplier-path evidence. Select a cell for its full audit trail.</p>
      </PageHead>
      <div className={`wrap view ${m.selected ? "with-side" : ""}`}>
        <div className="main-col">
          <div className="filters">
            <div className="seg" role="group" aria-label="Phase filter">
              <button aria-pressed={wave === "ALL"} onClick={() => setWave("ALL")}>All phases</button>
              {roots.map((id) => <button key={id} aria-pressed={wave === id} onClick={() => setWave(id)}>{id}</button>)}
            </div>
            <label className="toggle"><input type="checkbox" id="only-exposed" checked={onlyExposed} onChange={(e) => setOnlyExposed(e.target.checked)} />Exposed lines only</label>
          </div>
          <div className="matrix">
            <table>
              <thead>
                <tr>
                  <th scope="col">BOM line</th>
                  {waves.map((w) => <WaveHead key={w.id} w={w} />)}
                </tr>
              </thead>
              <tbody>
                {ids.length === 0 && <tr><td colSpan={waves.length + 1}><p className="muted pad">No lines match these filters.</p></td></tr>}
                {ids.map((id) => {
                  const p = parts[id];
                  const head = p.category !== lastCat ? (
                    <tr className="group" key={`g-${p.category}`}>
                      <th>{CATEGORY_PLAIN[p.category]}{CATEGORY_HELP[p.category] && <small>{CATEGORY_HELP[p.category]}</small>}</th>
                      <td colSpan={waves.length} />
                    </tr>
                  ) : null;
                  lastCat = p.category;
                  return [head, (
                    <tr key={id}>
                      <th scope="row"><span className="code">{id}</span><small>{p.brand}</small></th>
                      {waves.map((w) => <Cell key={w.id} ex={byKey.get(`${w.id}|${id}`)} m={m} />)}
                    </tr>
                  )];
                })}
              </tbody>
            </table>
          </div>
          <p className="footnote">An em dash indicates the line is not in that wave's BOM. Manufacturers and ownership links are drawn from Sayari (see the Parts page); the build plan, quantities, prices and value shares are hypothetical estimates.</p>
        </div>
        {m.selected && <Explainer m={m} />}
      </div>
    </>
  );
}

function WaveHead({ w }: { w: BuildWave }) {
  return (
    <th scope="col">
      <span className="wid">{w.id}</span>
      <span className="wname">{w.name}</span>
      <span className="wmeta">Procurement {monthLabel(w.procurement_date)}</span>
      <span className="wmeta">Segment: {SEGMENT_PLAIN[w.customer_segment]}</span>
      <span className="wmeta">Site: {country(w.site_country)} · {w.optics_generation_gbps / 1000}T {w.optics_form === "CPO" ? "CPO" : w.optics_form.toLowerCase()}</span>
    </th>
  );
}

function Cell({ ex, m }: { ex: Exposure | undefined; m: Model }) {
  if (!ex) return <td><span className="empty" aria-label="Not in this wave">—</span></td>;
  const lead = ex.hits.find((h) => h.status === ex.status);
  return (
    <td>
      <button className="cellbtn" aria-pressed={m.selected === ex.key} onClick={() => m.select(ex.key)}>
        <Chip status={ex.status} />
        {ex.status !== "CLEAR" && lead && <><Sureness g={lead.evidence} /><span className="code">{lead.evidence.label}</span></>}
        {ex.status === "CLEAR" && ex.carve_out_applied && <span className="small muted">Clear under carve-out</span>}
        {ex.flags.length > 0 && <span className="flags">{ex.flags.map((f) => <span className="flag" key={f}>{FLAG_PLAIN[f]}</span>)}</span>}
      </button>
    </td>
  );
}

// ================================================================ Explainer

export function Explainer({ m }: { m: Model }) {
  const ex = m.selected ? m.exposures.find((e) => e.key === m.selected) ?? null : null;
  const sources = useMemo(() => {
    const s = new Map<string, Source>();
    for (const b of m.bundles) for (const i of b.intel_items) for (const x of i.sources) s.set(x.id, x);
    return s;
  }, [m.bundles]);
  if (!ex) {
    return (
      <aside className="side" aria-label="Why?">
        <span className="kicker">Audit trail</span>
        <h3 className="display">Select a cell</h3>
        <p className="muted">Select any status to see the triggering rules, the supplier and ownership path, carve-out logic and the sources behind the confidence grade.</p>
      </aside>
    );
  }
  const subject = ex.bom_line_id ?? ex.tenant_id ?? "";
  const part = ex.bom_line_id ? m.input.dataset.parts[ex.bom_line_id] : null;
  const hits = [...ex.hits].sort((a, b) => b.weighted_risk - a.weighted_risk);
  return (
    <aside className="side" aria-label="Why?">
      <div className="side-h">
        <span className="kicker">Audit trail · {waveName(m, ex.build_wave_id)} · as of {monthLabel(ex.date)}</span>
        <button className="x" onClick={() => m.select(null)} aria-label="Close">×</button>
      </div>
      <h3 className="display">{part ? CATEGORY_PLAIN[part.category] : m.graph.name(subject)}</h3>
      <div className="muted"><span className="code">{subject}</span> {part ? `· ${part.brand}` : ""}</div>
      <Chip status={ex.status} />
      {ex.flags.includes("RECENT_OWNERSHIP_CHANGE") && <OwnershipTimeline m={m} tenantId={ex.tenant_id!} />}
      {hits.length === 0 && <p>No active rule reaches this {ex.row_kind === "TENANT" ? "tenant" : "line"} at the as-of date.</p>}
      {hits.map((h, i) => <HitView key={i} h={h} m={m} sources={sources} />)}
    </aside>
  );
}

function HitView({ h, m, sources }: { h: RuleHit; m: Model; sources: Map<string, Source> }) {
  const inst = m.bundles.flatMap((b) => b.instruments).find((i) => i.id === h.instrument_id);
  const srcIds = [...new Set(inst?.status_history.map((s) => s.source_id) ?? [])];
  const s = sureness(h.evidence);
  return (
    <div className="hit">
      <button className="hit-h linklike" onClick={() => openRule(m, h.rule_id)} title="Open this rule on the Rules page"><span className="rule-tag">{h.rule_id}</span><b>{RULE_SHORT[h.rule_id] ?? inst?.name}</b><span className="arrow">→</span></button>
      <Chip status={h.status} />
      <p>{RULE_PLAIN[h.rule_id] ?? ""}</p>
      {h.path.length > 1 && (
        <>
          <span className="label">Supplier and ownership path</span>
          <ol className="chain">{h.path.map((n, i) => <li key={i}>{m.graph.name(n)}</li>)}</ol>
        </>
      )}
      {h.carve_out_applied && <><span className="label">Carve-out</span><p>{h.carve_out_applied}</p></>}
      <span className="label">Confidence</span>
      <p><Sureness g={h.evidence} /> <span className="code" style={{ display: "inline" }}>{h.evidence.label}</span><br />{s.why} Assigned likelihood: {Math.round(h.likelihood * 100)}%.</p>
      <span className="label">Sources</span>
      <div className="sources">
        {srcIds.map((id) => {
          const x = sources.get(id);
          return x ? <span key={id}><a href={x.url} target="_blank" rel="noreferrer">{x.publisher}</a> <span className="muted small">· {monthLabel(x.date)}</span></span> : null;
        })}
        {inst && !inst.primary_source_available && <span className="nosrc">No primary source</span>}
      </div>
      <details className="more">
        <summary>Technical detail</summary>
        <dl className="kv">
          <dt>Context</dt><dd>{CONTEXT_PLAIN[h.context]}</dd>
          <dt>Instrument</dt><dd>{inst?.name}</dd>
          <dt>Weighted risk</dt><dd>{h.weighted_risk.toFixed(2)} (likelihood × severity × confidence)</dd>
          {h.note && <><dt>Engine note</dt><dd>{h.note}</dd></>}
          <dt>Node path</dt><dd className="code">{h.path.join(" → ")}</dd>
        </dl>
      </details>
    </div>
  );
}

function OwnershipTimeline({ m, tenantId }: { m: Model; tenantId: string }) {
  const recs = m.input.dataset.ownership.filter((o) => o.entity_node_id === tenantId).sort((a, b) => a.from_date.localeCompare(b.from_date));
  if (!recs.length) return null;
  const start = recs[0].from_date, end = "2027-12-31";
  const t0 = Date.parse(start), t1 = Date.parse(end);
  const pos = (d: string) => `${Math.max(0, Math.min(100, ((Date.parse(d) - t0) / (t1 - t0)) * 100))}%`;
  return (
    <div className="own">
      <span className="label">Ownership history</span>
      <div className="own-track">
        {recs.map((r) => {
          const hq = m.input.dataset.entities[r.parent_node_id]?.country_of_incorporation ?? "";
          const concern = ["CHN", "RUS", "IRN", "PRK"].includes(hq);
          return (
            <div key={r.parent_node_id + r.from_date} className={`own-seg ${concern ? "concern" : ""}`}
              style={{ left: pos(r.from_date), width: `calc(${pos(r.to_date ?? end)} - ${pos(r.from_date)} - 2px)` }}>
              {country(hq)}
            </div>
          );
        })}
      </div>
      <div className="own-legend">
        {recs.map((r) => <span key={r.parent_node_id}>{r.from_date.slice(0, 4)}–{r.to_date ? r.to_date.slice(0, 4) : "now"}: {m.graph.name(r.parent_node_id)}</span>)}
      </div>
      <p className="small muted">A change of control away from a country-of-concern parent within the 36-month lookback is flagged for analyst review. Whether control actually passed is an empirical question; the flag does not alter legal status.</p>
    </div>
  );
}

// ================================================================ Timeline

export function TimelineView({ m, series, onCursor }: { m: Model; series: MonthCounts[]; onCursor: (d: DateStr) => void }) {
  const [focus, setFocus] = useState<string | null>(null);
  const ar = focus ? m.rules.find((r) => r.rule.id === focus) : null;
  const entry = ar ? m.bundles.flatMap((b) => b.scenario.rules).find((r) => r.rule_id === ar.rule.id) : null;
  return (
    <>
      <PageHead kicker="Instrument timeline" title="When each instrument takes effect">
        <p>Each lane shows a rule's effective date under the selected cases, encoded by legal status: solid for enacted, hatched for proposed or introduced, sparse hatching for reported or rumored. Dashed boxes mark statutory transition periods. Changing a case shifts the lanes accordingly.</p>
      </PageHead>
      <div className="wrap view">
        <div className="grid-side">
          <section className="card">
            <header className="card-h"><h2>Rules by effective date</h2><p>Select a lane for rule text, likelihood basis and instrument.</p></header>
            <Swimlanes rules={m.rules} start="2026-01-01" end="2033-12-31" cursor={m.date} onPickRule={setFocus} />
          </section>
          <aside className="card">
            {ar ? (
              <div className="rulecard">
                <span className="kicker">{LEGAL_PLAIN[ar.instrument.legal_status]}</span>
                <h3 className="display">{RULE_SHORT[ar.rule.id] ?? ar.instrument.name}</h3>
                <p>{RULE_PLAIN[ar.rule.id]}</p>
                <dl className="kv">
                  <dt>Effective</dt><dd>{ar.rule.timing.effective_date ? monthLabel(ar.rule.timing.effective_date) : "Not set in this case"}{ar.rule.timing.transition_years ? `, with a ${ar.rule.timing.transition_years}-year transition` : ""}</dd>
                  <dt>Likelihood</dt><dd>{Math.round(ar.likelihood * 100)}%{entry ? `. ${entry.likelihood_basis}` : ""}</dd>
                  <dt>Instrument</dt><dd>{ar.instrument.name}</dd>
                  <dt>Confidence</dt><dd>{ar.rule.confidence_note}</dd>
                </dl>
                <button className="btn" onClick={() => openRule(m, ar.rule.id)}>Read the full rule</button>
              </div>
            ) : <p className="muted">Select a lane to read the rule text, its effective date and transition, likelihood basis and confidence note.</p>}
          </aside>
        </div>
        <section className="card">
          <header className="card-h"><h2>Exposure across the planning horizon</h2><p>Exposed line items and tenants when every phase is evaluated as of each month. Select a month to set the as-of date.</p></header>
          <ExposureOverTime series={series} cursor={m.date} onPick={onCursor} />
        </section>
      </div>
    </>
  );
}

// ================================================================ Fixes

export interface PresetLever { id: string; label: string; detail: string; models: string }

export function LeversView({ m, presets, active, toggle }: { m: Model; presets: PresetLever[]; active: string[]; toggle: (id: string, on: boolean) => void }) {
  const r = m.report;
  const totals = r ? r.waves.reduce((a, w) => ({ risk: a.risk + w.delta_risk, cost: a.cost + w.delta_cost_usd }), { risk: 0, cost: 0 }) : null;
  return (
    <>
      <PageHead kicker="Mitigation options" title="Design and sourcing responses">
        <p>Apply any combination of mitigations. All views re-evaluate, and the comparison below is against the same cases with no mitigations applied. Assumed carve-outs, such as an anticipated Conditional Approval or VEU grant, are labelled as assumptions throughout.</p>
      </PageHead>
      <div className="wrap view">
        <div className="lever-grid">
          {presets.map((p) => {
            const on = active.includes(p.id);
            return (
              <label key={p.id} className={`lever ${on ? "on" : ""}`}>
                <input type="checkbox" id={`lever-${p.id}`} checked={on} onChange={(e) => toggle(p.id, e.target.checked)} />
                <span className="lever-t">{p.label}</span>
                <span className="lever-d">{p.models}</span>
              </label>
            );
          })}
        </div>
        {!r ? <section className="card"><p className="muted">Apply a mitigation to compare Δ exposure, Δ cost and Δ schedule by phase.</p></section> : (
          <div className="grid-2">
            <section className="card">
              <header className="card-h"><h2>Δ likelihood-weighted risk by phase</h2><p>Negative values indicate reduced exposure.</p></header>
              <DeltaBars rows={r.waves.map((w) => ({ id: w.wave_id, delta: w.delta_risk }))} />
            </section>
            <section className="card">
              <header className="card-h"><h2>Cost and schedule impact</h2>{totals && <p>Net Δ cost {usd(totals.cost)}; net Δ weighted risk {totals.risk.toFixed(2)}.</p>}</header>
              <div className="tablewrap">
                <table className="plain">
                  <thead><tr><th>Phase</th><th>Δ cost</th><th>Δ schedule (wk)</th><th>Worst status after</th></tr></thead>
                  <tbody>
                    {r.waves.map((w) => (
                      <tr key={w.wave_id}>
                        <th>{w.wave_id}</th>
                        <td className={w.delta_cost_usd > 0 ? "worse" : w.delta_cost_usd < 0 ? "better" : ""}>{usd(w.delta_cost_usd)}</td>
                        <td className={w.delta_schedule_weeks > 0 ? "worse" : w.delta_schedule_weeks < 0 ? "better" : ""}>{w.delta_schedule_weeks > 0 ? "+" : ""}{w.delta_schedule_weeks}</td>
                        <td><Chip status={w.after.worst} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <span className="label">Mitigation assumptions</span>
              <ul className="notes">{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </section>
          </div>
        )}
      </div>
    </>
  );
}

const usd = (v: number) => (v === 0 ? "$0" : `${v < 0 ? "−" : "+"}$${(Math.abs(v) / 1e6).toFixed(2)}M`);

// ================================================================ Customers

export function TenantsView({ m }: { m: Model }) {
  const rows = m.exposures.filter((e) => e.row_kind === "TENANT");
  return (
    <>
      <PageHead kicker="Tenant screening" title="Remote-access exposure">
        <p>The November 2026 BIS interim final rule conditions the provision of significant IaaS compute on the headquarters of each tenant's ultimate parent. Tenants are screened on ultimate-parent HQ, monthly GPU-hours against the significant-volume threshold, and KYC status. An unverified tenant cannot resolve to Clear, and ownership history within a 36-month lookback is surfaced for review.</p>
      </PageHead>
      <div className={`wrap view ${m.selected ? "with-side" : ""}`}>
        <div className="main-col">
          {rows.length === 0 ? <section className="card"><p className="muted">Load Scenario 2 in the bar above to screen tenants.</p></section> : (
            <div className="matrix">
              <table>
                <thead><tr><th scope="col">Tenant</th><th scope="col">Phase</th><th scope="col">Ultimate parent HQ</th><th scope="col">GPU-hours / month</th><th scope="col">KYC</th><th scope="col">Status</th></tr></thead>
                <tbody>
                  {rows.map((e) => {
                    const t = m.input.dataset.tenants[e.tenant_id!];
                    return (
                      <tr key={e.key}>
                        <th scope="row">{t.name}<small className="code">{t.id}</small></th>
                        <td className="txt">{waveName(m, e.build_wave_id)}</td>
                        <td className="txt">{country(t.ultimate_parent_hq)}</td>
                        <td className="txt num">{t.monthly_gpu_hours.toLocaleString("en-US")}</td>
                        <td className="txt">{t.kyc_status === "VERIFIED" ? "Verified" : t.kyc_status === "PARTIAL" ? "Partial" : <span className="warn">Unverified</span>}</td>
                        <Cell ex={e} m={m} />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="footnote">Tenants are illustrative. The 250,000 GPU-hour monthly threshold is a placeholder pending the Federal Register text of the IFR.</p>
        </div>
        {m.selected && <Explainer m={m} />}
      </div>
    </>
  );
}

// ================================================================ Sources

export function EvidenceView({ m }: { m: Model }) {
  const sources = new Map<string, Source>();
  for (const b of m.bundles) for (const i of b.intel_items) for (const s of i.sources) sources.set(s.id, s);
  return (
    <>
      <PageHead kicker="Evidence and provenance" title="Source reliability and legal status">
        <p>Confidence propagates as a weakest-link function of three inputs: the instrument's legal status, its best available source, and each supplier or ownership edge on the triggering path. Sources are graded on the NATO Admiralty Code: source reliability A–F and information credibility 1–6. Secondary reporting of unpublished drafts is retained but never presented as primary.</p>
      </PageHead>
      <div className="wrap view">
        <section className="scale" aria-label="How sure scale">
          {[["High confidence", 4, "Enacted instrument with a primary source and well-evidenced supplier links."], ["Moderate confidence", 3, "Enacted, but key facts rest on legal analysis or weaker supplier evidence."], ["Low confidence", 2, "Introduced or reported instruments, or press-only sourcing."], ["Speculative", 1, "Rumor, analyst inference, or several weak links compounded."]].map(([l, n, d]) => (
            <div key={l as string}>
              <span className="sure"><span className="sure-bars" aria-hidden="true">{[1, 2, 3, 4].map((i) => <i key={i} className={i <= (n as number) ? "on" : ""} />)}</span>{l}</span>
              <p>{d}</p>
            </div>
          ))}
        </section>
        {m.bundles.map((b) => (
          <section className="card" key={b.scenario.id}>
            <header className="card-h"><h2>{SCENARIO_PLAIN[b.scenario.id]?.name ?? b.scenario.name}</h2><p>{SCENARIO_PLAIN[b.scenario.id]?.text}</p></header>
            <div className="tablewrap">
              <table className="plain">
                <thead><tr><th>Rule(s)</th><th>Legal status</th><th>Sources and grades</th></tr></thead>
                <tbody>
                  {b.instruments.map((inst) => (
                    <tr key={inst.id}>
                      <td><b>{inst.rules.map((r) => RULE_SHORT[r] ?? r).join(", ")}</b><div className="small muted">{inst.name}</div></td>
                      <td><span className={`legal legal-${inst.legal_status.toLowerCase()}`}>{LEGAL_PLAIN[inst.legal_status]}</span>{!inst.primary_source_available && <div className="nosrc">No primary source</div>}</td>
                      <td>
                        {[...new Set(inst.status_history.map((s) => s.source_id))].map((id) => {
                          const s = sources.get(id);
                          return s ? <div key={id} className="src"><a href={s.url} target="_blank" rel="noreferrer">{s.publisher}</a> <span className="small muted">· {s.source_type.toLowerCase().replace("_", " ")} · {s.reliability}{s.credibility} · {monthLabel(s.date)}</span><div className="small muted">{s.excerpt_note}</div></div> : null;
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="intel">
              <span className="label">Underlying intelligence items</span>
              {b.intel_items.map((i) => (
                <details key={i.id}>
                  <summary>{i.title} <span className="small muted">· {monthLabel(i.received_date)}</span></summary>
                  <p>{i.summary}</p>
                  {i.notes && <p className="muted">{i.notes}</p>}
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

// ================================================================ Words to know

const WORDS: [string, string][] = [
  ["Deployment phase", "A tranche of capacity, typically one data hall, with its own procurement date, energization date, customer segment and technology generation. The unit at which exposure is assessed (W1–W6)."],
  ["BOM line item", "One part type in the bill of materials, with its SKU, FCC authorization history, US-content estimate and supplier tree."],
  ["Logic-bearing component", "Under FCC 26-50, a hardware component that processes or controls data. Its producer, not the finished-device brand, determines Covered List exposure."],
  ["Covered List", "The FCC's list of equipment and services deemed to pose an unacceptable national-security risk. Covered equipment cannot obtain new equipment authorizations."],
  ["Equipment authorization", "FCC approval required before an RF device may be imported or marketed in the US. Rules restricting new authorizations leave existing grants in place."],
  ["Conditional Approval", "A time-limited DoW/DHS determination, up to 18 months, permitting authorization of otherwise covered foreign-produced equipment."],
  ["Domestic end product", "A product manufactured in the US whose domestic component cost exceeds a threshold: 65% through 2028, rising to 75% in 2029."],
  ["Section 1260H list", "DoD's list of Chinese military companies. It bars direct contracting and, after a lag, procurement of listed entities' goods, including through affiliates."],
  ["National security systems (NSS)", "Federal information systems whose function involves intelligence, cryptologic, military command or weapons activities. The procurement scope of S.5548."],
  ["Interim final rule (IFR)", "A rule effective without prior notice and comment, with comments taken after issuance. The form of the November 2026 BIS remote-access rule."],
  ["Ultimate parent HQ test", "Screening a counterparty by the headquarters of the top of its ownership chain rather than its place of incorporation or billing address."],
  ["IaaS remote access", "Use of compute hosted by a provider. Export controls can reach it when advanced chips serve end users in countries of concern."],
  ["KYC", "Know-your-customer due diligence: verifying a counterparty's identity and beneficial ownership."],
  ["Validated end user (VEU)", "A BIS authorization that lets pre-approved facilities receive controlled items without individual licenses."],
  ["Carve-out", "A condition under which a rule does not apply, such as a US-content threshold, an existing authorization or a Conditional Approval."],
  ["Scenario and case", "A scenario is a coherent set of regulatory actions; cases are alternative trajectories for it (as reported, delayed, broadened, dropped), as in base-case and downside-case planning."],
  ["Admiralty Code grade", "The NATO intelligence grading of source reliability (A–F) and information credibility (1–6), combined here with legal status on a weakest-link basis."],
  ["Weighted risk", "Likelihood × severity × confidence. Used to rank exposures and compare mitigations; not a probability."],
  ["As-of date", "The date at which rules are evaluated: either each phase's procurement date, or a single chosen date for every phase."],
];

export function WordsView() {
  return (
    <>
      <PageHead kicker="Glossary" title="Terms of art">
        <p>Definitions as used in the model. Where a term has a specific regulatory meaning, the model follows it.</p>
      </PageHead>
      <div className="wrap view">
        <dl className="glossary">
          {WORDS.map(([w, d]) => <div key={w}><dt>{w}</dt><dd>{d}</dd></div>)}
        </dl>
      </div>
    </>
  );
}

// ================================================================ Rules

/** Rule to scroll to when the Rules page opens. */
export const sessionRule: { current: string | null } = { current: null };
export function openRule(m: Model, id: string) { sessionRule.current = id; m.go("rules"); }

type Maturity = "ALL" | "ENACTED" | "PENDING" | "UNCONFIRMED";
const MATURITY: { id: Maturity; label: string }[] = [
  { id: "ALL", label: "All rules" },
  { id: "ENACTED", label: "Enacted" },
  { id: "PENDING", label: "Proposed or introduced" },
  { id: "UNCONFIRMED", label: "Reported or rumored" },
];
const maturityOf = (st: string): Maturity => (st === "ENACTED" ? "ENACTED" : st === "PROPOSED" || st === "INTRODUCED" ? "PENDING" : "UNCONFIRMED");

export function RulesView({ m }: { m: Model }) {
  const [filter, setFilter] = useState<Maturity>("ALL");
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    const id = sessionRule.current;
    sessionRule.current = null;
    if (!id) return;
    setFlash(id);
    requestAnimationFrame(() => document.getElementById(`rule-${id}`)?.scrollIntoView({ block: "start" }));
  }, []);
  const sources = new Map<string, Source>();
  for (const b of m.bundles) for (const i of b.intel_items) for (const x of i.sources) sources.set(x.id, x);

  return (
    <>
      <PageHead kicker="Rules" title="What each rule does">
        <p>Every rule in the loaded scenarios, set out in the same structure: what it restricts, who it targets, what it covers, the regulated activity, when it takes effect under the selected case, its exceptions, and why it matters for a data-center build. The last line of each card shows which line items and tenants it currently exposes.</p>
      </PageHead>
      <div className="wrap view">
        <section className="howto">
          <div><span className="label">How to read a rule</span><p>A rule bites only when four tests pass together. The <b>regulated activity</b> must be in scope, such as a new FCC authorization or DoD procurement. The <b>date</b> must be on or after the rule takes effect. The <b>product</b> must be in scope. And a <b>target</b> must appear somewhere on the part's supplier or ownership path. Exceptions are then applied, and the most severe surviving outcome becomes the cell's status.</p></div>
          <div className="seg" role="group" aria-label="Filter by legal status">
            {MATURITY.map((f) => <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>)}
          </div>
        </section>
        {m.bundles.length === 0 && <section className="card"><p className="muted">Load a scenario in the bar above to see its rules.</p></section>}
        {m.bundles.map((b) => {
          const branchId = m.input.scenarios.find((x) => x.bundle.scenario.id === b.scenario.id)?.branch_id ?? "";
          const rules = b.scenario.rules.map((e) => ({ entry: e, rule: b.rules.find((r) => r.id === e.rule_id)!, inst: b.instruments.find((i) => i.rules.includes(e.rule_id)) }))
            .filter((r) => r.rule && r.inst && (filter === "ALL" || maturityOf(r.inst.legal_status) === filter));
          return (
            <section key={b.scenario.id} className="rulegroup">
              <header className="rulegroup-h">
                <h2>{SCENARIO_PLAIN[b.scenario.id]?.name ?? b.scenario.name}</h2>
                <p>{SCENARIO_PLAIN[b.scenario.id]?.text} Case: <b>{BRANCH_PLAIN[branchId]?.name ?? branchId}</b>. {BRANCH_PLAIN[branchId]?.text}</p>
              </header>
              {rules.length === 0 && <p className="muted">No rules in this scenario match the filter.</p>}
              <div className="rulecards">
                {rules.map(({ entry, rule, inst }) => {
                  const ex = RULE_EXPLAINED[rule.id];
                  const active = m.rules.find((a) => a.rule.id === rule.id);
                  const eff = active?.rule.timing.effective_date ?? null;
                  const ctxDates = Object.entries(active?.rule.timing.context_effective_dates ?? {});
                  const trans = active?.rule.timing.transition_years;
                  const affected = m.exposures.filter((e) => e.hits.some((h) => h.rule_id === rule.id && h.status !== "CLEAR"));
                  const srcIds = [...new Set(inst!.status_history.map((h) => h.source_id))];
                  return (
                    <article key={rule.id} id={`rule-${rule.id}`} className={`rulefull ${flash === rule.id ? "flash" : ""}`}>
                      <header className="rulefull-h">
                        <span className="rule-tag">{rule.id}</span>
                        <h3>{RULE_SHORT[rule.id] ?? inst!.name}</h3>
                        <span className={`legal legal-${inst!.legal_status.toLowerCase()}`}>{LEGAL_PLAIN[inst!.legal_status]}</span>
                        {!inst!.primary_source_available && <span className="nosrc">No primary source</span>}
                        <span className="likely">Likelihood {Math.round((active?.likelihood ?? entry.likelihood) * 100)}%</span>
                      </header>
                      <p className="rulefull-what">{ex?.what ?? RULE_PLAIN[rule.id]}</p>
                      {ex && (
                        <dl className="facts">
                          <div><dt>Covered parties</dt><dd>{ex.targets}</dd></div>
                          <div><dt>Covered products</dt><dd>{ex.covers}</dd></div>
                          <div><dt>Regulated activity</dt><dd>{ex.where}</dd></div>
                          <div><dt>Effective date</dt><dd>{!active ? <span className="muted">Not active in this case.</span>
                            : ctxDates.length ? ctxDates.map(([c, d]) => <span key={c} className="block">{monthLabel(d as string)}: {CONTEXT_PLAIN[c as keyof typeof CONTEXT_PLAIN]}</span>)
                            : eff ? <>{monthLabel(eff)}{trans ? <>; full effect after a {trans}-year transition</> : null}</> : <span className="muted">No effective date in this case.</span>}</dd></div>
                          <div><dt>Exceptions</dt><dd>{ex.exceptions}</dd></div>
                          <div className="wide"><dt>Implications</dt><dd>{ex.matters}</dd></div>
                        </dl>
                      )}
                      <div className="affects">
                        <span className="label">Current exposure</span>
                        {affected.length === 0 ? <span className="muted small">No line items or tenants exposed under the selected cases and as-of date.</span> : (
                          <div className="affect-list">
                            {affected.map((e) => {
                              const h = e.hits.find((x) => x.rule_id === rule.id && x.status !== "CLEAR")!;
                              return (
                                <button key={e.key} className="affect" onClick={() => { m.select(e.key); m.go(e.row_kind === "TENANT" ? "tenants" : "matrix"); }}>
                                  <b>{e.bom_line_id ?? e.tenant_id}</b> · {e.build_wave_id} <Chip status={h.status} />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <footer className="rulefull-f">
                        <span>{inst!.name}</span>
                        {srcIds.map((id) => { const x = sources.get(id); return x ? <a key={id} href={x.url} target="_blank" rel="noreferrer">{x.publisher} ({x.reliability}{x.credibility})</a> : null; })}
                      </footer>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

// ================================================================ Parts

const sayariUrl = (id: string) => `https://graph.sayari.com/resource/entity/${id}`;

function EntityLink({ m, id }: { m: Model; id: string }) {
  const e = m.input.dataset.entities[id];
  if (!e) return <span>{id}</span>;
  const label = <>{e.name}{e.production_country || e.country_of_incorporation ? <span className="muted small"> · {country(e.production_country || e.country_of_incorporation)}</span> : null}</>;
  return e.sayari_entity_id ? <a href={sayariUrl(e.sayari_entity_id)} target="_blank" rel="noreferrer">{label}</a> : <span>{label}</span>;
}

export function PartsView({ m }: { m: Model }) {
  const data = m.input.dataset;
  const [cat, setCat] = useState<ProductCategory | "ALL">("ALL");
  const usedIn = (id: string) => m.input.waves.filter((w) => (w.quantities[id] ?? 0) > 0);
  const parts = Object.values(data.parts).filter((p) => !p.id.includes("+"));
  const cats = CATEGORY_ORDER.filter((c) => parts.some((p) => p.category === c));
  return (
    <>
      <PageHead kicker="Parts and products" title="What goes into the build">
        <p>Every part in the bill of materials, with the company that makes it, who owns that company, the logic-bearing components inside, its US-content estimate and authorization status, the deployment phases that use it, and the rules affecting it now. Manufacturers and ownership links come from Sayari; the data center, tenants, quantities and prices are hypothetical.</p>
      </PageHead>
      <div className="wrap view">
        <section className="howto">
          <div>
            <span className="label">How to read the evidence</span>
            <p>Ownership links recorded in Sayari registry data are graded <b>B2</b>. Affiliations inferred only from an entity's name are graded <b>C3</b>. Component suppliers are <b>representative</b> of the part class (C3–C4), not traced shipments: they show the typical supply pattern and are the first thing to replace with traced trade records.</p>
          </div>
          <div className="seg" role="group" aria-label="Filter by product">
            <button aria-pressed={cat === "ALL"} onClick={() => setCat("ALL")}>All parts</button>
            {cats.map((c) => <button key={c} aria-pressed={cat === c} onClick={() => setCat(c)}>{CATEGORY_PLAIN[c]}</button>)}
          </div>
        </section>
        {cats.filter((c) => cat === "ALL" || c === cat).map((c) => {
          const ex = PRODUCT_EXPLAINED[c];
          return (
            <section key={c} className="rulegroup">
              <header className="rulegroup-h"><h2>{CATEGORY_PLAIN[c]}</h2></header>
              {ex && (
                <dl className="facts productfacts">
                  <div><dt>What it is</dt><dd>{ex.what}</dd></div>
                  <div><dt>Role in the facility</dt><dd>{ex.role}</dd></div>
                  <div><dt>Key components</dt><dd>{ex.inside}</dd></div>
                  <div><dt>Why regulators care</dt><dd>{ex.regulators}</dd></div>
                </dl>
              )}
              <div className="rulecards">
                {parts.filter((p) => p.category === c).sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true })).map((p) => {
                  const tree = m.graph.treeNodes(p.id, "CONTAINS_ANY_COMPONENT");
                  const asm = tree.find((n) => n.edge.relationship === "assembles");
                  const comps = tree.filter((n) => n.edge.relationship === "supplies_component");
                  const owners = asm ? m.graph.ultimateParent(asm.node).path : [];
                  const waves = usedIn(p.id);
                  const affected = m.exposures.filter((e) => e.bom_line_id === p.id && e.status !== "CLEAR");
                  const s = p.us_bom_value_share;
                  const auth = p.fcc_auth.grant_date ? `Authorized ${monthLabel(p.fcc_auth.grant_date)}` : "New model: needs a new FCC authorization";
                  return (
                    <article key={p.id} className="rulefull" id={`part-${p.id}`}>
                      <header className="rulefull-h">
                        <span className="rule-tag">{p.id}</span>
                        <h3>{p.brand} · {p.sku}</h3>
                        {p.generation_gbps ? <span className="likely">{p.generation_gbps >= 1000 ? `${p.generation_gbps / 1000}T` : `${p.generation_gbps}G`}</span> : null}
                      </header>
                      <dl className="facts">
                        <div><dt>Manufacturer</dt><dd>{asm ? <EntityLink m={m} id={asm.node} /> : "Unresolved"}{asm && <span className="code">grade {asm.edge.evidence_grade}</span>}</dd></div>
                        <div><dt>Ownership chain</dt><dd>{owners.length ? owners.map((o, i) => <span key={o} className="block">{i > 0 ? "↳ " : ""}<EntityLink m={m} id={o} /></span>) : <span className="muted">Independent, or ownership not recorded</span>}</dd></div>
                        <div className="wide"><dt>Key components</dt><dd>
                          {comps.length === 0 ? <span className="muted">No sub-components modeled.</span> : (
                            <ul className="comps">
                              {comps.map((n) => (
                                <li key={n.node + n.edge.component_role}>
                                  <b>{ROLE_PLAIN[n.edge.component_role] ?? n.edge.component_role}</b>
                                  {n.edge.logic_bearing && <span className="lb">logic-bearing</span>}
                                  {n.edge.value_share_est != null && <span className="muted small"> ~{Math.round(n.edge.value_share_est * 100)}% of value</span>}
                                  <span className="block"><EntityLink m={m} id={n.node} /> <span className="code" style={{ display: "inline" }}>grade {n.edge.evidence_grade}</span></span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </dd></div>
                        <div><dt>US BOM value (est.)</dt><dd>{Math.round(s.estimate * 100)}% <span className="muted small">(range {Math.round(s.low * 100)}–{Math.round(s.high * 100)}%)</span><span className="block muted small">{s.basis}</span></dd></div>
                        <div><dt>FCC equipment authorization</dt><dd>{auth}{p.fcc_auth.conditional_approval_expiry && <span className="block muted small">Conditional Approval to {monthLabel(p.fcc_auth.conditional_approval_expiry)}{p.fcc_auth.conditional_approval_assumed ? " (assumed)" : ""}</span>}</dd></div>
                        <div><dt>Unit cost and lead time</dt><dd>${p.unit_cost_usd.toLocaleString("en-US")} per unit · {p.lead_time_weeks} weeks <span className="block muted small">Estimates</span></dd></div>
                        <div><dt>Alternates</dt><dd>{p.alternates.length ? p.alternates.map((a) => <span key={a} className="block">{a} · {data.parts[a]?.brand}</span>) : <span className="muted">None listed</span>}</dd></div>
                      </dl>
                      <div className="affects">
                        <span className="label">Deployment phases</span>
                        {waves.length === 0 ? <span className="muted small">Not in any deployment phase under the applied mitigations.</span> : (
                          <div className="affect-list">{waves.map((w) => <span key={w.id} className="affect static"><b>{w.id}</b> · {w.quantities[p.id].toLocaleString("en-US")} units</span>)}</div>
                        )}
                      </div>
                      <div className="affects">
                        <span className="label">Current exposure</span>
                        {affected.length === 0 ? <span className="muted small">No rule reaches this part under the selected cases.</span> : (
                          <div className="affect-list">
                            {affected.map((e) => {
                              const h = e.hits.find((x) => x.status === e.status)!;
                              return (
                                <button key={e.key} className="affect" onClick={() => { m.select(e.key); m.go("matrix"); }}>
                                  <b>{RULE_SHORT[h.rule_id] ?? h.rule_id}</b> · {e.build_wave_id} <Chip status={e.status} />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
