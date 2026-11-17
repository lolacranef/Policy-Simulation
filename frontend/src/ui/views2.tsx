import { useMemo, useState } from "react";
import type { Status } from "../model/types";
import { CASES, HALL_PARTS, HARMS, type Verdict } from "./content";
import { DataCenterModel, type PartKey } from "./datacenter";
import { CATEGORY_PLAIN } from "./plain";
import { bucketOf, Chip, monthLabel, type Bucket } from "./shared";
import { PageHead, type Model } from "./views";
import { severityIndex } from "../engine/evaluate";

const HEX: Record<Bucket, string> = { block: "#e25a4a", lic: "#8a76e8", watch: "#b4870f", clear: "#1f9e80" };

// ================================================================ 02 Data center

export function DataCenterView({ m }: { m: Model }) {
  const roots = m.input.waves.filter((w) => !w.parent_wave_id);
  const [part, setPart] = useState<PartKey | null>("optics");
  const [phase, setPhase] = useState(roots.find((w) => w.id === "W3")?.id ?? roots[0]?.id ?? "W1");
  const [colorBy, setColorBy] = useState(true);
  const [paused, setPaused] = useState(false);
  const wave = m.input.waves.find((w) => w.id === phase);
  const byKey = useMemo(() => new Map(m.exposures.map((e) => [e.key, e])), [m.exposures]);
  const phaseWaves = m.input.waves.filter((w) => w.id === phase || w.parent_wave_id === phase);

  const linesFor = (key: PartKey) => {
    const hp = HALL_PARTS.find((p) => p.key === key)!;
    const ids = new Set(hp.bom);
    for (const id of Object.keys(m.input.dataset.parts)) if (id.includes("+") && ids.has(id.split("+")[0])) ids.add(id);
    return phaseWaves.flatMap((w) => [...ids].filter((id) => (w.quantities[id] ?? 0) > 0).map((id) => ({ w, id, qty: w.quantities[id], ex: byKey.get(`${w.id}|${id}`) })));
  };
  const worst = (key: PartKey): Status | null => {
    const ls = linesFor(key).filter((l) => l.ex);
    if (!ls.length) return null;
    return ls.reduce<Status>((s, l) => (severityIndex(l.ex!.status) > severityIndex(s) ? l.ex!.status : s), "CLEAR");
  };
  const colors = colorBy ? Object.fromEntries(HALL_PARTS.map((p) => { const s = worst(p.key); return [p.key, s ? HEX[bucketOf(s)] : undefined]; }).filter(([, c]) => c)) as Partial<Record<PartKey, string>> : undefined;
  const sel = HALL_PARTS.find((p) => p.key === part) ?? null;
  const selLines = sel ? linesFor(sel.key) : [];

  return (
    <>
      <PageHead kicker="02 · Inside a data center" title="Where the regulated parts sit">
        <p>One data hall, simplified. Drag to rotate and select any part to see what it does, which rules reach it, and how it fares in the deployment phase you choose. With status colors on, each part takes the most severe result among its line items in that phase.</p>
      </PageHead>
      <div className="wrap view">
        <div className="dc-layout">
          <section className="card dc-stage">
            <div className="dc-toolbar">
              <div className="seg" role="group" aria-label="Deployment phase">
                {roots.map((w) => <button key={w.id} aria-pressed={phase === w.id} onClick={() => setPhase(w.id)} title={w.name}>{w.id}</button>)}
              </div>
              <label className="toggle"><input type="checkbox" id="dc-color" checked={colorBy} onChange={(e) => setColorBy(e.target.checked)} />Status colors</label>
              <button className="btn" onClick={() => setPaused((p) => !p)}>{paused ? "Resume rotation" : "Pause rotation"}</button>
            </div>
            <DataCenterModel selected={part} onPick={(p) => setPart((cur) => (cur === p ? null : p))} colors={colors} paused={paused} />
            <div className="dc-foot">
              <span className="muted small">{wave?.name} · procurement {wave && monthLabel(wave.procurement_date)} · drag to rotate, select to focus</span>
              {colorBy && <span className="legend">{(["block", "lic", "watch", "clear"] as Bucket[]).map((b) => <span key={b}><i className={`sw sw-${b}`} />{{ block: "Barred", lic: "License required", watch: "Monitor", clear: "Clear" }[b]}</span>)}</span>}
            </div>
          </section>
          <aside className="dc-side">
            <div className="dc-parts" role="listbox" aria-label="Parts of the data hall">
              {HALL_PARTS.map((p) => {
                const s = worst(p.key);
                return (
                  <button key={p.key} role="option" aria-selected={part === p.key} className="dc-part" onClick={() => setPart(part === p.key ? null : p.key)}>
                    <span>{p.name}</span>
                    {s ? <Chip status={s} /> : <span className="muted small">{p.bom.length ? "not in this phase" : "no rule"}</span>}
                  </button>
                );
              })}
            </div>
            {sel && (
              <div className="card dc-detail">
                <h3 className="display">{sel.name}</h3>
                <p>{sel.what}</p>
                <span className="label">Which rules reach it</span>
                <p className="muted">{sel.regulated}</p>
                {sel.note && <p className="note">{sel.note}</p>}
                {sel.bom.length > 0 && (
                  <>
                    <span className="label">Line items in {phase}</span>
                    {selLines.length === 0 ? <p className="muted small">None of these line items is used in {phase}.</p> : (
                      <div className="affect-list">
                        {selLines.map((l) => (
                          <button key={l.w.id + l.id} className="affect" onClick={() => { if (l.ex) m.select(l.ex.key); m.go("matrix"); }}>
                            <b>{l.id}</b> · {l.qty.toLocaleString("en-US")} units {l.ex && <Chip status={l.ex.status} />}
                          </button>
                        ))}
                      </div>
                    )}
                    <button className="btn" onClick={() => m.go("parts")}>Read about these parts</button>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
        <p className="footnote">Schematic, not to scale. Line items and statuses come from the current scenario cases and as-of setting in the bar above. {CATEGORY_PLAIN.OPTICAL_TRANSCEIVER} are drawn as the overhead fiber trays they plug into.</p>
      </div>
    </>
  );
}

// ================================================================ 03 Why it matters

export function WhyView() {
  const [open, setOpen] = useState(0);
  return (
    <>
      <PageHead kicker="03 · Why it matters" title="Policy gaps are where human rights harms travel">
        <p>The rules in this model are written for national security and trade. The gaps between them, though, line up closely with documented human rights harms: compute that ends up powering surveillance, firms already named for repression, forced labor in electronics, military end use, and pressure on the communities that host the data centers.</p>
      </PageHead>
      <div className="wrap view">
        <section className="card">
          <header className="card-h"><h2>Gap and right at a glance</h2><p>Each gap the model exposes, and the right most at stake when it is exploited.</p></header>
          <div className="tablewrap">
            <table className="plain">
              <thead><tr><th>#</th><th>Harm</th><th>Right at stake</th><th>Where the rules leave a gap</th></tr></thead>
              <tbody>
                {HARMS.map((h, i) => (
                  <tr key={h.t} className="clickrow" onClick={() => setOpen(i)}>
                    <th>{String(i + 1).padStart(2, "0")}</th><td><b>{h.t}</b></td><td>{h.right}</td><td className="muted">{h.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="harms">
          {HARMS.map((h, i) => {
            const on = open === i;
            return (
              <div key={h.t} className={`hcard ${on ? "on" : ""}`}>
                <button className="hbtn" aria-expanded={on} onClick={() => setOpen(on ? -1 : i)}>
                  <span className="hnum">{String(i + 1).padStart(2, "0")}</span>
                  <span><b>{h.t}</b><small>{h.line}</small></span>
                  <span className="hchev" aria-hidden="true">{on ? "−" : "+"}</span>
                </button>
                {on && (
                  <div className="hbody">
                    {h.body.map((p, k) => <p key={k}>{p}</p>)}
                    <div className="gapbox"><span className="label">The policy gap</span><p>{h.gap}</p></div>
                    <span className="label">Documented by</span>
                    <ul className="hsrc">{h.src.map(([n, u]) => <li key={u}><a href={u} target="_blank" rel="noreferrer">{n}</a></li>)}</ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="footnote">Sayari risk flags cited here are statistical signals from supplier and product patterns, not findings of abuse. Naming a company in a supply path is not an allegation of wrongdoing.</p>
      </div>
    </>
  );
}

// ================================================================ 06 Case files

const VERDICT_LABEL: Record<Verdict, string> = { caught: "Caught", partly: "Partly", missed: "Missed" };

export function CasesView() {
  const [sel, setSel] = useState(CASES[0].id);
  const c = CASES.find((x) => x.id === sel)!;
  const tally = (v: Verdict) => c.verdicts.filter((x) => x[1] === v).length;
  return (
    <>
      <PageHead kicker="06 · Case files" title="Would any rule have caught this?">
        <p>Real companies, shipments and ownership chains from Sayari's trade and corporate records, each run through the rules in this model. A dated snapshot, retrieved 16 November 2026, not a live feed. The cases show where rules reach and where they stop; none establishes a violation.</p>
      </PageHead>
      <div className="wrap view">
        <div className="casetabs" role="tablist">
          {CASES.map((x, i) => (
            <button key={x.id} role="tab" aria-selected={x.id === sel} className="casetab" onClick={() => setSel(x.id)}>
              <span className="hnum small">{String(i + 1).padStart(2, "0")}</span>
              <span><b>{x.title}</b><small>{x.q}</small></span>
            </button>
          ))}
        </div>
        <article className="card casebody" aria-live="polite">
          <span className="kicker">{c.q}</span>
          <h2 className="display casetitle">{c.title}</h2>
          <p className="lede">{c.sum}</p>
          <div className="casegrid">
            <section>
              <span className="label">What the records show</span>
              <ol className="steps-tl">
                {c.steps.map(([d, t, links], i) => (
                  <li key={i}>
                    <span className="tl-date">{d}</span>
                    <p>{t}</p>
                    <span className="tl-links">{links.map(([n, u]) => <a key={u} href={u} target="_blank" rel="noreferrer">{n}</a>)}</span>
                  </li>
                ))}
              </ol>
            </section>
            <section>
              <span className="label">Run through the rules</span>
              <div className="tally">
                <span className="v-caught">{tally("caught")} caught</span><span className="v-partly">{tally("partly")} partly</span><span className="v-missed">{tally("missed")} missed</span>
              </div>
              <ul className="verdicts">
                {c.verdicts.map(([rule, v, why]) => (
                  <li key={rule}><span className={`verdict v-${v}`}>{VERDICT_LABEL[v]}</span><div><b>{rule}</b><p>{why}</p></div></li>
                ))}
              </ul>
              <div className="gapbox"><span className="label">What this case teaches</span><p>{c.lesson}</p></div>
            </section>
          </div>
        </article>
      </div>
    </>
  );
}
