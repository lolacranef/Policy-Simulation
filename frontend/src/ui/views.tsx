import { useMemo, useState, type ReactNode } from "react";
import type { ActiveRule } from "../engine/branches";
import type { SupplyGraph } from "../engine/graph";
import type { LeverReport } from "../engine/levers";
import type { EvalInput } from "../engine/evaluate";
import type { BuildWave, DateStr, EvidenceGrade, Exposure, ProductCategory, RuleHit, ScenarioBundle, Source } from "../model/types";
import { DeltaBars, ExposureOverTime, Swimlanes, WaveBars, type MonthCounts } from "./charts";
import { Guilloche, Rule } from "./ornament";
import {
  CATEGORY_HELP, CATEGORY_PLAIN, CONTEXT_PLAIN, country, FLAG_PLAIN, LEGAL_PLAIN, RULE_PLAIN, RULE_SHORT, SCENARIO_PLAIN, SEGMENT_PLAIN, sureness,
} from "./plain";
import { BUCKETS, BUCKET_LABEL, bucketOf, CATEGORY_LABEL, Chip, monthLabel } from "./shared";

export type TabId = "overview" | "matrix" | "timeline" | "levers" | "tenants" | "evidence" | "words";

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
          <span className="kicker">Chokepoint · regulatory foresight for data centers · intelligence as of 16 November 2026</span>
          <h1 className="display hero-title">If tomorrow's rules<br />arrived today, what<br />could we still build?</h1>
          <p className="hero-lede">
            A data center is a building full of computers. Those computers are built from parts made all over the world.
            New government rules can stop some of those parts from being bought or used. This tool lets you test a rule
            <em> before</em> it happens, and see which parts and which buildings would have trouble.
          </p>
          <div className="hero-cta">
            <button className="btn primary" onClick={tour[0].run}>Take the 3-minute tour</button>
            <button className="btn" onClick={() => m.go("matrix")}>Check the parts</button>
          </div>
        </div>
      </section>

      <div className="wrap view">
        <section className="steps" aria-label="How it works">
          <div><span className="step-n">1</span><h3>Pick a story</h3><p>Choose a "what if" story in the bar above, like a rule that was only reported in the news.</p></div>
          <div><span className="step-n">2</span><h3>Check every part</h3><p>The tool checks each part, in each building, against each rule, on the day it matters.</p></div>
          <div><span className="step-n">3</span><h3>Find a fix</h3><p>Try changes, like a different supplier, and see what they cost and how much they help.</p></div>
        </section>

        <Rule />

        <section className="answer">
          <div>
            <span className="kicker">The answer right now</span>
            <h2 className="display">{rows.length ? `${counts.block} of ${rows.length} are not allowed` : "No story loaded"}</h2>
            <p className="lede">
              {rows.length === 0 ? "Turn on a story in the bar above to see results." : <>
                Under <b>{m.branchNames.join(" and ")}</b>, {counts.block} parts or customers are not allowed and {counts.lic} need a permit.{" "}
                {first && <>The first problem appears in <b>{monthLabel(first.date)}</b>, in building {first.build_wave_id}. </>}
                {worst && worst[1] > 0 && <>The building with the most trouble is <b>{worst[0]} · {waveName(m, worst[0])}</b>.</>}
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
            <header className="card-h"><h2>Which buildings have trouble?</h2><p>Each bar is one building. Click a bar to see its parts.</p></header>
            <WaveBars waves={m.input.waves} exposures={rows} onPick={(id) => { sessionWave.current = id; m.go("matrix"); }} />
          </section>
          <section className="card">
            <header className="card-h"><h2>Guided tour</h2><p>Five short stops. Each button sets things up for you.</p></header>
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
          <header className="card-h"><h2>The biggest problems</h2><p>The most serious first. Click one to see why.</p></header>
          {top.length === 0 ? <p className="muted">Nothing has trouble in this story.</p> : (
            <div className="toplist">
              {top.map((e) => {
                const lead = e.hits.find((h) => h.status === e.status);
                const subject = e.bom_line_id ? m.input.dataset.parts[e.bom_line_id] : null;
                return (
                  <button key={e.key} className="toprow" onClick={() => { m.select(e.key); m.go(e.row_kind === "TENANT" ? "tenants" : "matrix"); }}>
                    <span><b>{subject ? CATEGORY_PLAIN[subject.category] : "Customer"}</b><span className="code">{e.bom_line_id ?? e.tenant_id}</span></span>
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
      <PageHead kicker="Parts check" title="Can we buy each part?">
        <p>Each <b>row</b> is a kind of part. Each <b>column</b> is a building we plan to fill with computers. The colored label says whether that part is allowed for that building. Under it, the bars show how sure we are. Click any label to see why.</p>
      </PageHead>
      <div className={`wrap view ${m.selected ? "with-side" : ""}`}>
        <div className="main-col">
          <div className="filters">
            <div className="seg" role="group" aria-label="Show building">
              <button aria-pressed={wave === "ALL"} onClick={() => setWave("ALL")}>All buildings</button>
              {roots.map((id) => <button key={id} aria-pressed={wave === id} onClick={() => setWave(id)}>{id}</button>)}
            </div>
            <label className="toggle"><input type="checkbox" id="only-exposed" checked={onlyExposed} onChange={(e) => setOnlyExposed(e.target.checked)} />Only show parts with problems</label>
          </div>
          <div className="matrix">
            <table>
              <thead>
                <tr>
                  <th scope="col">Part</th>
                  {waves.map((w) => <WaveHead key={w.id} w={w} />)}
                </tr>
              </thead>
              <tbody>
                {ids.length === 0 && <tr><td colSpan={waves.length + 1}><p className="muted pad">No parts match these filters.</p></td></tr>}
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
          <p className="footnote">A dash (—) means that building doesn't use that part. Part names like "Supplier A" are made-up examples.</p>
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
      <span className="wmeta">Buying {monthLabel(w.procurement_date)}</span>
      <span className="wmeta">For {SEGMENT_PLAIN[w.customer_segment]}</span>
      <span className="wmeta">In {country(w.site_country)}</span>
    </th>
  );
}

function Cell({ ex, m }: { ex: Exposure | undefined; m: Model }) {
  if (!ex) return <td><span className="empty" aria-label="Not used in this building">—</span></td>;
  const lead = ex.hits.find((h) => h.status === ex.status);
  return (
    <td>
      <button className="cellbtn" aria-pressed={m.selected === ex.key} onClick={() => m.select(ex.key)}>
        <Chip status={ex.status} />
        {ex.status !== "CLEAR" && lead && <Sureness g={lead.evidence} />}
        {ex.status === "CLEAR" && ex.carve_out_applied && <span className="small muted">OK because of an exception</span>}
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
        <span className="kicker">Why?</span>
        <h3 className="display">Pick a label</h3>
        <p className="muted">Click any colored label to see which rule caused it, the chain of companies behind it, and where the information came from.</p>
      </aside>
    );
  }
  const subject = ex.bom_line_id ?? ex.tenant_id ?? "";
  const part = ex.bom_line_id ? m.input.dataset.parts[ex.bom_line_id] : null;
  const hits = [...ex.hits].sort((a, b) => b.weighted_risk - a.weighted_risk);
  return (
    <aside className="side" aria-label="Why?">
      <div className="side-h">
        <span className="kicker">Why? · {waveName(m, ex.build_wave_id)} · {monthLabel(ex.date)}</span>
        <button className="x" onClick={() => m.select(null)} aria-label="Close">×</button>
      </div>
      <h3 className="display">{part ? CATEGORY_PLAIN[part.category] : m.graph.name(subject)}</h3>
      <div className="muted"><span className="code">{subject}</span> {part ? `· ${part.brand}` : ""}</div>
      <Chip status={ex.status} />
      {ex.flags.includes("RECENT_OWNERSHIP_CHANGE") && <OwnershipTimeline m={m} tenantId={ex.tenant_id!} />}
      {hits.length === 0 && <p>No rule affects this {ex.row_kind === "TENANT" ? "customer" : "part"} on this date, so it's OK.</p>}
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
      <div className="hit-h"><span className="rule-tag">{h.rule_id}</span><b>{RULE_SHORT[h.rule_id] ?? inst?.name}</b></div>
      <Chip status={h.status} />
      <p>{RULE_PLAIN[h.rule_id] ?? ""}</p>
      {h.path.length > 1 && (
        <>
          <span className="label">How this part is connected</span>
          <ol className="chain">{h.path.map((n, i) => <li key={i}>{m.graph.name(n)}</li>)}</ol>
        </>
      )}
      {h.carve_out_applied && <><span className="label">Exception</span><p>{h.carve_out_applied}</p></>}
      <span className="label">How sure are we?</span>
      <p><Sureness g={h.evidence} /> {s.why} The chance this rule happens is about {Math.round(h.likelihood * 100)}%.</p>
      <span className="label">Where this comes from</span>
      <div className="sources">
        {srcIds.map((id) => {
          const x = sources.get(id);
          return x ? <span key={id}><a href={x.url} target="_blank" rel="noreferrer">{x.publisher}</a> <span className="muted small">· {monthLabel(x.date)}</span></span> : null;
        })}
        {inst && !inst.primary_source_available && <span className="nosrc">No official document yet</span>}
      </div>
      <details className="more">
        <summary>More detail</summary>
        <dl className="kv">
          <dt>Applies to</dt><dd>{CONTEXT_PLAIN[h.context]}</dd>
          <dt>Evidence grade</dt><dd className="code">{h.evidence.label}</dd>
          <dt>Risk score</dt><dd>{h.weighted_risk.toFixed(2)} (chance × seriousness × sureness)</dd>
          {h.note && <><dt>Engine note</dt><dd>{h.note}</dd></>}
          <dt>Path IDs</dt><dd className="code">{h.path.join(" → ")}</dd>
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
      <span className="label">Who owned this customer</span>
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
      <p className="small muted">A recent change from an owner in China is a warning sign worth checking. On its own it doesn't break any rule.</p>
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
      <PageHead kicker="Timeline" title="When do the rules start?">
        <p>Each line is one rule. The bar starts on the day the rule begins. A solid bar is an official rule. A striped bar is only proposed, or only in the news. Change the story in the bar above and watch the bars move.</p>
      </PageHead>
      <div className="wrap view">
        <div className="grid-side">
          <section className="card">
            <header className="card-h"><h2>The rules, year by year</h2><p>Click a rule to read about it.</p></header>
            <Swimlanes rules={m.rules} start="2026-01-01" end="2033-12-31" cursor={m.date} onPickRule={setFocus} />
          </section>
          <aside className="card">
            {ar ? (
              <div className="rulecard">
                <span className="kicker">{LEGAL_PLAIN[ar.instrument.legal_status]}</span>
                <h3 className="display">{RULE_SHORT[ar.rule.id] ?? ar.instrument.name}</h3>
                <p>{RULE_PLAIN[ar.rule.id]}</p>
                <dl className="kv">
                  <dt>Starts</dt><dd>{ar.rule.timing.effective_date ? monthLabel(ar.rule.timing.effective_date) : "No date in this story"}{ar.rule.timing.transition_years ? `, then a ${ar.rule.timing.transition_years}-year wait` : ""}</dd>
                  <dt>Chance</dt><dd>About {Math.round(ar.likelihood * 100)}%{entry ? `. ${entry.likelihood_basis}` : ""}</dd>
                  <dt>Official name</dt><dd>{ar.instrument.name}</dd>
                </dl>
              </div>
            ) : <p className="muted">Click any rule on the left to read what it does, when it starts and how likely it is.</p>}
          </aside>
        </div>
        <section className="card">
          <header className="card-h"><h2>How many problems, month by month</h2><p>Each column checks every part and customer in that month. Click a month to check everything on that date.</p></header>
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
      <PageHead kicker="Ways to fix it" title="What could we do differently?">
        <p>Turn on any of these ideas. Every page updates to show what would change. Below, you'll see how much each idea lowers the risk, and what it costs in money and time.</p>
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
        {!r ? <section className="card"><p className="muted">Turn on an idea above to see how it helps.</p></section> : (
          <div className="grid-2">
            <section className="card">
              <header className="card-h"><h2>Does it lower the risk?</h2><p>Bars to the left mean less risk.</p></header>
              <DeltaBars rows={r.waves.map((w) => ({ id: w.wave_id, delta: w.delta_risk }))} />
            </section>
            <section className="card">
              <header className="card-h"><h2>What does it cost?</h2>{totals && <p>Total: {usd(totals.cost)} and the risk score changes by {totals.risk.toFixed(2)}.</p>}</header>
              <div className="tablewrap">
                <table className="plain">
                  <thead><tr><th>Building</th><th>Extra money</th><th>Extra weeks</th><th>Worst result after</th></tr></thead>
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
              <span className="label">What we assumed</span>
              <ul className="notes">{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </section>
          </div>
        )}
      </div>
    </>
  );
}

const usd = (v: number) => (v === 0 ? "$0" : `${v < 0 ? "−" : "+"}$${(Math.abs(v) / 1e6).toFixed(1)} million`);

// ================================================================ Customers

export function TenantsView({ m }: { m: Model }) {
  const rows = m.exposures.filter((e) => e.row_kind === "TENANT");
  return (
    <>
      <PageHead kicker="Customers" title="Who uses the computers?">
        <p>Some data centers rent out their computers to other companies. A new rule says that if a customer is really owned by a company in China, Russia or Iran, and uses a lot of computer power, the data center needs a permit. So we check who really owns each customer. If we can't check, the answer can't be "OK".</p>
      </PageHead>
      <div className={`wrap view ${m.selected ? "with-side" : ""}`}>
        <div className="main-col">
          {rows.length === 0 ? <section className="card"><p className="muted">Turn on Story 2 in the bar above to check customers.</p></section> : (
            <div className="matrix">
              <table>
                <thead><tr><th scope="col">Customer</th><th scope="col">Building</th><th scope="col">Real owner is in</th><th scope="col">Computer hours per month</th><th scope="col">Checked?</th><th scope="col">Result</th></tr></thead>
                <tbody>
                  {rows.map((e) => {
                    const t = m.input.dataset.tenants[e.tenant_id!];
                    return (
                      <tr key={e.key}>
                        <th scope="row">{t.name}<small className="code">{t.id}</small></th>
                        <td className="txt">{waveName(m, e.build_wave_id)}</td>
                        <td className="txt">{country(t.ultimate_parent_hq)}</td>
                        <td className="txt num">{t.monthly_gpu_hours.toLocaleString("en-US")}</td>
                        <td className="txt">{t.kyc_status === "VERIFIED" ? "Yes" : t.kyc_status === "PARTIAL" ? "Partly" : <span className="warn">Not yet</span>}</td>
                        <Cell ex={e} m={m} />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="footnote">All customers here are made-up examples. The "lots of computer power" limit (250,000 hours a month) is a placeholder until the official rule text is read.</p>
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
      <PageHead kicker="Sources" title="How do we know?">
        <p>Not all information is equally strong. An official government document is very strong. A news story about a secret draft is weaker. A rumor is weakest. Every result in this tool is only as strong as its weakest piece of information.</p>
      </PageHead>
      <div className="wrap view">
        <section className="scale" aria-label="How sure scale">
          {[["Very sure", 4, "An official rule with a published document."], ["Fairly sure", 3, "Official, but some facts come from summaries."], ["Not very sure", 2, "From news reports, or a bill that hasn't passed."], ["A guess", 1, "A rumor, or several weak links in a row."]].map(([l, n, d]) => (
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
                <thead><tr><th>Rule</th><th>What kind of information</th><th>Where it comes from</th></tr></thead>
                <tbody>
                  {b.instruments.map((inst) => (
                    <tr key={inst.id}>
                      <td><b>{inst.rules.map((r) => RULE_SHORT[r] ?? r).join(", ")}</b><div className="small muted">{inst.name}</div></td>
                      <td><span className={`legal legal-${inst.legal_status.toLowerCase()}`}>{LEGAL_PLAIN[inst.legal_status]}</span>{!inst.primary_source_available && <div className="nosrc">No official document yet</div>}</td>
                      <td>
                        {[...new Set(inst.status_history.map((s) => s.source_id))].map((id) => {
                          const s = sources.get(id);
                          return s ? <div key={id} className="src"><a href={s.url} target="_blank" rel="noreferrer">{s.publisher}</a> <span className="small muted">· {monthLabel(s.date)}</span><div className="small muted">{s.excerpt_note}</div></div> : null;
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="intel">
              <span className="label">The original news and documents</span>
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
  ["Data center", "A building full of computers that store information and run programs, like AI."],
  ["Building (build wave)", "A group of computers bought and set up at the same time, usually one hall of a data center. We call them W1 to W6."],
  ["Part", "One kind of thing a building needs, like a fiber-optic plug or a network switch. Engineers call the full list a \"bill of materials\"."],
  ["Supplier", "The company that makes a part, or a piece inside it."],
  ["Owner (parent company)", "The company that owns a supplier. Some rules care about who owns a company, not just where its factory is."],
  ["FCC", "The US agency that must approve electronic devices before they can be sold in America."],
  ["Banned list (Covered List)", "The FCC's list of companies and products it considers a security risk."],
  ["Bill", "An idea for a new law. It only becomes law if Congress passes it and the President signs it."],
  ["Permit (license)", "Written permission from the government to sell or ship something."],
  ["Exception", "A special case where a rule doesn't apply, like when most of a part's value is American."],
  ["Story (scenario)", "A \"what if\" about the future. Each story has versions, like \"as the news says\" or \"never happens\"."],
  ["How sure are we", "How strong the information is. Official documents are strong; news about a secret draft is weaker; rumors are weakest."],
  ["Customer (tenant)", "A company that rents computer power from a data center instead of owning its own."],
  ["Checking customers (KYC)", "Short for \"Know Your Customer\": finding out who really owns a customer before doing business with them."],
  ["Risk score", "A number that combines how likely a rule is, how serious its effect is, and how sure we are. Bigger means more worry."],
];

export function WordsView() {
  return (
    <>
      <PageHead kicker="Words to know" title="A short glossary">
        <p>The words this tool uses, explained simply.</p>
      </PageHead>
      <div className="wrap view">
        <dl className="glossary">
          {WORDS.map(([w, d]) => <div key={w}><dt>{w}</dt><dd>{d}</dd></div>)}
        </dl>
      </div>
    </>
  );
}
