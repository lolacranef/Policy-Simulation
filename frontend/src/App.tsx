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
  { id: "overview", label: "Start here" },
  { id: "matrix", label: "Parts check" },
  { id: "timeline", label: "Timeline" },
  { id: "levers", label: "Ways to fix it" },
  { id: "tenants", label: "Customers" },
  { id: "evidence", label: "Sources" },
  { id: "words", label: "Words to know" },
];

const PRESETS: (PresetLever & { lever: Lever })[] = [
  { id: "usc", label: "Use more American pieces", models: "Put an American-made chip and laser inside Supplier A's fastest plug, to try to reach the 65% American exception.", detail: "RAISE_US_CONTENT",
    lever: { kind: "RAISE_US_CONTENT", line_id: "XCVR-A-3200", wave_id: "W3" } },
  { id: "gen", label: "Stay one speed slower in W3", models: "Use 1.6T plugs instead of the fastest 3.2T ones, which the reported rule targets. Slower plugs use more of them.", detail: "SHIFT_GENERATION",
    lever: { kind: "SHIFT_GENERATION", wave_id: "W3", gbps: 1600 } },
  { id: "pluggable", label: "Keep plugs removable in W4", models: "Don't build the light parts into the switch. Then one banned part can't block the whole switch.", detail: "CHANGE_OPTICS_FORM",
    lever: { kind: "CHANGE_OPTICS_FORM", wave_id: "W4", form: "PLUGGABLE" } },
  { id: "enclave", label: "A separate government section in W2", models: "Split off the 30% of W2 that serves government, and buy its parts from approved suppliers.", detail: "FEDERAL_ENCLAVE",
    lever: { kind: "FEDERAL_ENCLAVE", wave_id: "W2", federal_share: 0.3 } },
  { id: "inv", label: "American-made power converters", models: "Swap the Chinese-made battery power converters for ones made in America.", detail: "SWAP_SUPPLIER",
    lever: { kind: "SWAP_SUPPLIER", line_id: "INV-BESS-1", alternate_id: "INV-BESS-US" } },
  { id: "ca", label: "Renew the routers' permission", models: "Assume the routers get a new 18-month permission starting June 2027.", detail: "SEEK_CONDITIONAL_APPROVAL",
    lever: { kind: "SEEK_CONDITIONAL_APPROVAL", line_id: "RTR-EDGE-1", assumed_grant: "2027-06-01", term_months: 18 } },
  { id: "cap", label: "Limit customer T4", models: "Only let customer T4 use 200,000 computer hours a month, under the limit.", detail: "TENANT_CAP",
    lever: { kind: "TENANT_CAP", tenant_id: "T4", max_gpu_hours: 200000 } },
  { id: "veu", label: "Get approved as a trusted site (W5)", models: "Assume the Malaysia building is approved as a trusted buyer from March 2027.", detail: "APPLY_VEU",
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
    { title: "Start with today", body: "Only official rules count. Some parts already have trouble, like the Chinese-made power converters.", cta: "Show today",
      run: () => { setOpticsOn(true); setOpticsBranch("dropped"); setLevers([]); setCursorOn(false); setSelected("W2|XCVR-A-1600"); go("matrix"); } },
    { title: "Add the news report", body: "A rule reported in the news would block Supplier A's fastest plugs in W3 and W4. We're not very sure, because there's no official document.", cta: "Show the news",
      run: () => { setOpticsBranch("as-reported"); setLevers([]); setCursorOn(false); setSelected("W3|XCVR-A-3200"); go("matrix"); } },
    { title: "Try a fix", body: "Using American pieces makes the plug about 70% American. But we're not certain it passes 65%, so it becomes \"keep an eye on\", not \"OK\".", cta: "Try the fix",
      run: () => { setOpticsBranch("as-reported"); setLevers(["usc"]); setCursorOn(false); go("levers"); } },
    { title: "Move through time", body: "A Senate bill gives a five-year wait, so the government block in W4 only shows up from mid-2032.", cta: "Open the timeline",
      run: () => { setOpticsBranch("as-reported"); setCursorOn(true); setCursor(MONTHS.indexOf("2032-07-01")); setSelected("W4|XCVR-A-3200"); go("timeline"); } },
    { title: "Meet the customers", body: "Customer T2 was owned by a Chinese company until 2024. That's a warning sign worth checking, not a broken rule.", cta: "See customers",
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
          <span className="banner">Example data · for learning</span>
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
              <button aria-pressed={!cursorOn} onClick={() => setCursorOn(false)} title="Check each building on the day its parts are bought">Buying day</button>
              <button aria-pressed={cursorOn} onClick={() => setCursorOn(true)} title="Check everything on one month you choose">A month I pick</button>
            </div>
            <input type="range" id="cursor" min={0} max={MONTHS.length - 1} value={cursor} aria-label="Month to check"
              onChange={(e) => { setCursor(Number(e.target.value)); setCursorOn(true); }} />
            <span className="readout">{cursorOn ? monthLabel(MONTHS[cursor]) : "buying days"}</span>
          </div>
          {levers.length > 0 && <button className="lever-pill" onClick={() => go("levers")}>{levers.length} fix{levers.length > 1 ? "es" : ""} turned on</button>}
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
            <p>A chokepoint is a narrow spot where one block can stop everything behind it. This teaching tool finds where new rules could do that to a data center's supply chain. It shows what could happen. It does not predict what will happen.</p>
          </div>
          <div>
            <span className="foot-h">Explore</span>
            {TABS.map((t) => <a key={t.id} href={`#${t.id}`} onClick={(e) => { e.preventDefault(); go(t.id); }}>{t.label}</a>)}
          </div>
          <div>
            <span className="foot-h">About the data</span>
            <p>Suppliers, parts, prices and customers are made-up examples. Real company names appear only because public reports name them in rules. Students will replace the examples with traced data.</p>
          </div>
          <div>
            <span className="foot-h">Please note</span>
            <p>This is for planning and learning. It is not legal advice.</p>
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
