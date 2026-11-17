import { useEffect, useMemo, useState } from "react";
import { loadSeed, OPTICS_SCENARIO, REMOTE_ACCESS_SCENARIO } from "./data/seed";
import { resolveRules } from "./engine/branches";
import { monthRange } from "./engine/dates";
import { evaluate, type EvalInput } from "./engine/evaluate";
import { SupplyGraph } from "./engine/graph";
import { applyLevers, compareLevers, type Lever } from "./engine/levers";
import type { DateStr, ScenarioBundle } from "./model/types";
import type { MonthCounts } from "./ui/charts";
import { BUCKETS, bucketOf, monthLabel } from "./ui/shared";
import { BRANCH_PLAIN, SCENARIO_PLAIN } from "./ui/plain";
import { Guilloche } from "./ui/ornament";
import {
  EvidenceView, LeversView, MatrixView, Overview, TenantsView, TimelineView, WordsView,
  type Model, type PresetLever, type TabId, type TourStep,
} from "./ui/views";

const seed = loadSeed();
const MONTHS = monthRange("2026-10-01", "2033-12-01");

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "matrix", label: "Exposure matrix" },
  { id: "timeline", label: "Timeline" },
  { id: "levers", label: "Mitigations" },
  { id: "tenants", label: "Tenant screening" },
  { id: "evidence", label: "Evidence" },
  { id: "words", label: "Glossary" },
];

const PRESETS: (PresetLever & { lever: Lever })[] = [
  { id: "usc", label: "Raise US content (Supplier A, 3.2T)", models: "Substitute a US-fabricated DSP and laser to approach the reported 65% US-BOM-value carve-out. The uncertainty band is propagated, so a straddling range resolves to Monitor.", detail: "RAISE_US_CONTENT",
    lever: { kind: "RAISE_US_CONTENT", line_id: "XCVR-A-3200", wave_id: "W3" } },
  { id: "gen", label: "Defer the 3.2T transition in W3", models: "Hold W3 at 1.6T, below the reported generation threshold, accepting a port-count and power penalty.", detail: "SHIFT_GENERATION",
    lever: { kind: "SHIFT_GENERATION", wave_id: "W3", gbps: 1600 } },
  { id: "pluggable", label: "Pluggable rather than CPO in W4", models: "Keep optics modular so a designated optical-engine producer cannot block authorization of the whole switch under the component rule.", detail: "CHANGE_OPTICS_FORM",
    lever: { kind: "CHANGE_OPTICS_FORM", wave_id: "W4", form: "PLUGGABLE" } },
  { id: "enclave", label: "Federal enclave in W2", models: "Partition the mixed hall and source a separate optics pool for the 30% federal share, re-sourcing any line exposed under 1260H or S.5548.", detail: "FEDERAL_ENCLAVE",
    lever: { kind: "FEDERAL_ENCLAVE", wave_id: "W2", federal_share: 0.3 } },
  { id: "inv", label: "Domestic connected inverters", models: "Replace foreign-produced BESS inverters with a domestic end product candidate to fall under the DA 26-786 carve-out.", detail: "SWAP_SUPPLIER",
    lever: { kind: "SWAP_SUPPLIER", line_id: "INV-BESS-1", alternate_id: "INV-BESS-US" } },
  { id: "ca", label: "Renew router Conditional Approval", models: "Assume a further 18-month Conditional Approval from June 2027. Flagged as an assumption.", detail: "SEEK_CONDITIONAL_APPROVAL",
    lever: { kind: "SEEK_CONDITIONAL_APPROVAL", line_id: "RTR-EDGE-1", assumed_grant: "2027-06-01", term_months: 18 } },
  { id: "cap", label: "Cap tenant T4", models: "Meter T4 at 200,000 GPU-hours per month, below the placeholder threshold. Resolves to Monitor, not Clear, while the threshold is unconfirmed.", detail: "TENANT_CAP",
    lever: { kind: "TENANT_CAP", tenant_id: "T4", max_gpu_hours: 200000 } },
  { id: "veu", label: "Validated end user for W5", models: "Assume a data-center VEU authorization for the Johor campus from March 2027. Flagged as an assumption.", detail: "APPLY_VEU",
    lever: { kind: "APPLY_VEU", wave_id: "W5", assumed_approval_date: "2027-03-01" } },
];

const tabFromHash = (): TabId => {
  const h = window.location.hash.replace("#", "") as TabId;
  return TABS.some((t) => t.id === h) ? h : "overview";
};

export default function App() {
  const [tab, setTab] = useState<TabId>(tabFromHash);
  const [opticsOn, setOpticsOn] = useState(true);
  const [opticsBranch, setOpticsBranch] = useState("as-reported");
  const [remoteOn, setRemoteOn] = useState(true);
  const [remoteBranch, setRemoteBranch] = useState("as-issued");
  const [cursorOn, setCursorOn] = useState(false);
  const [cursor, setCursor] = useState(MONTHS.indexOf("2027-03-01"));
  const [levers, setLevers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const on = () => setTab(tabFromHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = (t: TabId) => {
    if (window.location.hash !== `#${t}`) window.location.hash = t;
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  const date: DateStr | null = cursorOn ? MONTHS[cursor] : null;
  const scenarios = useMemo(() => [
    ...(opticsOn ? [{ bundle: OPTICS_SCENARIO, branch_id: opticsBranch }] : []),
    ...(remoteOn ? [{ bundle: REMOTE_ACCESS_SCENARIO, branch_id: remoteBranch }] : []),
  ], [opticsOn, opticsBranch, remoteOn, remoteBranch]);
  const leverList = useMemo(() => PRESETS.filter((p) => levers.includes(p.id)).map((p) => p.lever), [levers]);

  const core = useMemo(() => {
    const base: EvalInput = { dataset: seed.dataset, waves: seed.datacenter.waves, scenarios, date: null };
    const applied = leverList.length ? applyLevers(base, leverList).input : base;
    const graph = new SupplyGraph(applied.dataset);
    const report = leverList.length ? compareLevers(base, leverList) : null;
    const series: MonthCounts[] = MONTHS.map((d) => {
      const ex = evaluate({ ...applied, date: d });
      return { date: d, counts: Object.fromEntries(BUCKETS.map((b) => [b, ex.filter((e) => bucketOf(e.status) === b).length])) as MonthCounts["counts"] };
    });
    return { applied, graph, report, series, rules: resolveRules(scenarios) };
  }, [scenarios, leverList]);

  const exposures = useMemo(() => evaluate({ ...core.applied, date }), [core.applied, date]);
  const bundles = scenarios.map((s) => s.bundle);
  const branchNames = scenarios.map((s) => `"${BRANCH_PLAIN[s.branch_id]?.name ?? s.branch_id}"`);

  const model: Model = {
    input: core.applied, exposures, report: core.report, rules: core.rules, bundles, graph: core.graph, branchNames, date,
    selected, select: setSelected, go,
  };

  const tour: TourStep[] = [
    { title: "Establish the exposure floor", body: "Under the Dropped branch only enacted instruments apply. Inverter and 1260H exposure already exist.", cta: "Show the floor",
      run: () => { setOpticsOn(true); setOpticsBranch("dropped"); setLevers([]); setCursorOn(false); setSelected("W2|XCVR-A-1600"); go("matrix"); } },
    { title: "Introduce the reported draft", body: "The reported 3.2T rule bars Supplier A in W3 and W4, graded REPORTED with no primary source.", cta: "Show the draft",
      run: () => { setOpticsBranch("as-reported"); setLevers([]); setCursorOn(false); setSelected("W3|XCVR-A-3200"); go("matrix"); } },
    { title: "Engineer US content", body: "A US DSP and laser lift the estimate to about 70%, but the range straddles 65%, so the line resolves to Monitor rather than Clear.", cta: "Apply the lever",
      run: () => { setOpticsBranch("as-reported"); setLevers(["usc"]); setCursorOn(false); go("levers"); } },
    { title: "Advance the as-of date", body: "S.5548's five-year transition means the federal NSS bar in W4 appears only from mid-2032.", cta: "Open the timeline",
      run: () => { setOpticsBranch("as-reported"); setCursorOn(true); setCursor(MONTHS.indexOf("2032-07-01")); setSelected("W4|XCVR-A-3200"); go("timeline"); } },
    { title: "Screen the tenants", body: "T2 changed control away from a Chinese parent in 2024. The flag prompts review; it is not a legal finding.", cta: "Screen tenants",
      run: () => { setRemoteOn(true); setRemoteBranch("as-issued"); setCursorOn(false); setSelected("W5|tenant:T2"); go("tenants"); } },
  ];

  return (
    <>
      <header className="topbar">
        <Guilloche className="topbar-pattern" lines={10} h={120} />
        <div className="wrap topbar-in">
          <a className="wordmark" href="#overview" onClick={(e) => { e.preventDefault(); go("overview"); }}>
            <span>Chokepoint</span>
            <small>Find where new rules could choke your data-center supply chain</small>
          </a>
          <span className="banner">Illustrative data · scenario planning</span>
        </div>
        <nav className="tabs wrap" aria-label="Sections">
          {TABS.map((t) => (
            <a key={t.id} href={`#${t.id}`} aria-current={tab === t.id ? "page" : undefined} onClick={(e) => { e.preventDefault(); go(t.id); }}>{t.label}</a>
          ))}
        </nav>
      </header>

      <div className="controlbar">
        <div className="wrap controlbar-in">
          <BranchPicker bundle={OPTICS_SCENARIO} on={opticsOn} setOn={setOpticsOn} branch={opticsBranch} setBranch={setOpticsBranch} />
          <BranchPicker bundle={REMOTE_ACCESS_SCENARIO} on={remoteOn} setOn={setRemoteOn} branch={remoteBranch} setBranch={setRemoteBranch} />
          <div className="ctl ctl-date">
            <span className="ctl-label">As of</span>
            <div className="seg" role="group" aria-label="As of">
              <button aria-pressed={!cursorOn} onClick={() => setCursorOn(false)} title="Evaluate each wave at its own procurement date">Procurement date</button>
              <button aria-pressed={cursorOn} onClick={() => setCursorOn(true)} title="Evaluate every wave at one chosen month">Fixed date</button>
            </div>
            <input type="range" id="cursor" min={0} max={MONTHS.length - 1} value={cursor} aria-label="As-of month"
              onChange={(e) => { setCursor(Number(e.target.value)); setCursorOn(true); }} />
            <span className="readout">{cursorOn ? monthLabel(MONTHS[cursor]) : "per wave"}</span>
          </div>
          {levers.length > 0 && <button className="lever-pill" onClick={() => go("levers")}>{levers.length} lever{levers.length > 1 ? "s" : ""} applied</button>}
        </div>
      </div>

      <main>
        {tab === "overview" && <Overview m={model} tour={tour} />}
        {tab === "matrix" && <MatrixView m={model} />}
        {tab === "timeline" && <TimelineView m={model} series={core.series} onCursor={(d) => { setCursor(MONTHS.indexOf(d)); setCursorOn(true); }} />}
        {tab === "levers" && <LeversView m={model} presets={PRESETS} active={levers} toggle={(id, on) => setLevers((l) => (on ? [...l, id] : l.filter((x) => x !== id)))} />}
        {tab === "tenants" && <TenantsView m={model} />}
        {tab === "evidence" && <EvidenceView m={model} />}
        {tab === "words" && <WordsView />}
      </main>

      <footer className="foot">
        <Guilloche className="foot-pattern" lines={14} h={200} />
        <div className="wrap foot-in">
          <div>
            <span className="foot-title">Chokepoint</span>
            <p>A chokepoint is a narrow spot where one block can stop everything behind it. This model locates where prospective regulation would do that to a data center's supply chain. It conditions on scenarios; it does not forecast policy.</p>
          </div>
          <div>
            <span className="foot-h">Sections</span>
            {TABS.map((t) => <a key={t.id} href={`#${t.id}`} onClick={(e) => { e.preventDefault(); go(t.id); }}>{t.label}</a>)}
          </div>
          <div>
            <span className="foot-h">About the data</span>
            <p>Suppliers, SKUs, costs, value shares and tenants are illustrative placeholders. Named firms appear only as rule targets drawn from public reporting. The import contract accepts Sayari-traced replacements without code changes.</p>
          </div>
          <div>
            <span className="foot-h">Limitations</span>
            <p>Scenario planning, not legal advice. Supplier capacity is not modeled, so rerouting understates price and lead-time shocks.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

function BranchPicker(p: { bundle: ScenarioBundle; on: boolean; setOn: (v: boolean) => void; branch: string; setBranch: (v: string) => void }) {
  const sc = p.bundle.scenario;
  const plain = SCENARIO_PLAIN[sc.id];
  return (
    <div className="ctl">
      <label className="toggle" title={plain?.text}>
        <input type="checkbox" checked={p.on} onChange={(e) => p.setOn(e.target.checked)} aria-label={`Use ${plain?.name ?? sc.name}`} />{plain?.name ?? sc.name}
      </label>
      <select value={p.branch} disabled={!p.on} onChange={(e) => p.setBranch(e.target.value)} aria-label={`Version of ${plain?.name ?? sc.name}`} title={BRANCH_PLAIN[p.branch]?.text}>
        {sc.branches.map((b) => <option key={b.id} value={b.id}>{BRANCH_PLAIN[b.id]?.name ?? b.name}</option>)}
      </select>
    </div>
  );
}
