import { useState, type MouseEvent as RME } from "react";
import type { BuildWave, DateStr, Exposure } from "../model/types";
import type { ActiveRule } from "../engine/branches";
import { addYears } from "../engine/dates";
import { BUCKETS, BUCKET_LABEL, bucketOf, Legend, monthLabel, Tooltip, useWidth, type Bucket, type Tip } from "./shared";
import { LEGAL_PLAIN, RULE_SHORT } from "./plain";

const COLOR: Record<Bucket, string> = { block: "var(--c-block)", lic: "var(--c-lic)", watch: "var(--c-watch)", clear: "var(--c-clear)" };

// ---------------------------------------------------------------- exposure by wave (horizontal stacked bars)

export function WaveBars({ waves, exposures, onPick }: { waves: BuildWave[]; exposures: Exposure[]; onPick: (waveId: string) => void }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip | null>(null);
  const rows = waves.map((w) => {
    const ex = exposures.filter((e) => e.build_wave_id === w.id);
    const counts = Object.fromEntries(BUCKETS.map((b) => [b, ex.filter((e) => bucketOf(e.status) === b).length])) as Record<Bucket, number>;
    return { w, counts, total: ex.length };
  });
  const max = Math.max(1, ...rows.map((r) => r.total));
  const labelW = Math.min(220, width * 0.34), rowH = 34, barH = 18, right = 40;
  const plotW = width - labelW - right;
  const h = rows.length * rowH + 8;
  return (
    <div className="chart" ref={ref}>
      <Legend items={BUCKETS} />
      <svg width={width} height={h} role="img" aria-label="Line items and tenants by status for each deployment phase">
        {rows.map((r, i) => {
          const y = i * rowH + 6;
          let x = labelW;
          return (
            <g key={r.w.id} className="clickable" onClick={() => onPick(r.w.id)}>
              <rect x={0} y={y - 4} width={width} height={rowH - 2} fill="transparent" />
              <text x={0} y={y + barH / 2 + 4} className="ax-strong">{r.w.id}</text>
              <text x={34} y={y + barH / 2 + 4} className="ax">{r.w.name.length > 22 && labelW < 200 ? r.w.name.slice(0, 20) + "…" : r.w.name}</text>
              {BUCKETS.map((b) => {
                const n = r.counts[b];
                if (!n) return null;
                const bw = Math.max(2, (n / max) * plotW - 2);
                const seg = (
                  <rect key={b} x={x} y={y} width={bw} height={barH} rx={2} fill={COLOR[b]}
                    onMouseMove={(e) => setTip({ x: e.nativeEvent.offsetX + 12, y: e.nativeEvent.offsetY - 10,
                      body: <><b>{r.w.id} · {BUCKET_LABEL[b]}</b><br />{n} of {r.total} line items and tenants</> })}
                    onMouseLeave={() => setTip(null)} />
                );
                x += bw + 2;
                return seg;
              })}
              <text x={x + 6} y={y + barH / 2 + 4} className="ax">{r.total}</text>
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

// ---------------------------------------------------------------- exposure over time (stacked columns)

export interface MonthCounts { date: DateStr; counts: Record<Bucket, number> }

export function ExposureOverTime({ series, cursor, onPick }: { series: MonthCounts[]; cursor: DateStr | null; onPick: (d: DateStr) => void }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip | null>(null);
  const shown: Bucket[] = ["block", "lic", "watch"];
  const left = 34, right = 8, top = 10, h = 200, bottom = 24;
  const plotW = width - left - right, plotH = h - top - bottom;
  const max = Math.max(1, ...series.map((s) => shown.reduce((a, b) => a + s.counts[b], 0)));
  const step = plotW / series.length;
  const bw = Math.max(1, step - 2);
  const yTicks = [0, Math.ceil(max / 2), max];
  return (
    <div className="chart" ref={ref}>
      <Legend items={shown} />
      <svg width={width} height={h} role="img" aria-label="Exposed rows per month">
        {yTicks.map((t) => {
          const y = top + plotH - (t / max) * plotH;
          return <g key={t}><line x1={left} x2={width - right} y1={y} y2={y} className="grid" /><text x={left - 6} y={y + 4} className="ax" textAnchor="end">{t}</text></g>;
        })}
        {series.map((s, i) => {
          const x = left + i * step + 1;
          let y = top + plotH;
          const total = shown.reduce((a, b) => a + s.counts[b], 0);
          return (
            <g key={s.date} className="clickable" onClick={() => onPick(s.date)}
              onMouseMove={(e) => setTip({ x: e.nativeEvent.offsetX + 12, y: e.nativeEvent.offsetY - 10, body: <>
                <b>{monthLabel(s.date)}</b><br />
                {shown.map((b) => <span key={b} className="tiprow"><i className={`sw sw-${b}`} />{BUCKET_LABEL[b]} <b>{s.counts[b]}</b></span>)}
                <span className="tiphint">Select to set the as-of date</span></> })}
              onMouseLeave={() => setTip(null)}>
              <rect x={x - 1} y={top} width={step} height={plotH} fill="transparent" />
              {shown.map((b) => {
                const n = s.counts[b];
                if (!n) return null;
                const bh = (n / max) * plotH;
                y -= bh;
                const r = <rect key={b} x={x} y={y + 1} width={bw} height={Math.max(1, bh - 1)} fill={COLOR[b]} />;
                return r;
              })}
              {total === 0 && <rect x={x} y={top + plotH - 1} width={bw} height={1} fill="var(--line-strong)" />}
            </g>
          );
        })}
        {series.filter((s) => s.date.endsWith("-01-01")).map((s) => {
          const i = series.indexOf(s);
          return <text key={s.date} x={left + i * step} y={h - 6} className="ax">{s.date.slice(0, 4)}</text>;
        })}
        {cursor && series.findIndex((s) => s.date === cursor) >= 0 && (() => {
          const x = left + series.findIndex((s) => s.date === cursor) * step + step / 2;
          return <g><line x1={x} x2={x} y1={top - 4} y2={top + plotH} className="cursor" /><text x={x + 4} y={top + 4} className="ax-cursor">as of</text></g>;
        })()}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

// ---------------------------------------------------------------- instrument swimlanes

const STATUS_FILL: Record<string, string> = {
  ENACTED: "var(--lane-solid)", PROPOSED: "url(#hatch)", INTRODUCED: "url(#hatch)", REPORTED: "url(#hatch-sparse)", RUMORED: "url(#hatch-sparse)", WITHDRAWN: "none",
};

export function Swimlanes({ rules, start, end, cursor, onPickRule }: {
  rules: ActiveRule[]; start: DateStr; end: DateStr; cursor: DateStr | null; onPickRule: (id: string) => void;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip | null>(null);
  const labelW = Math.min(250, width * 0.36), right = 10, rowH = 30, top = 8;
  const plotW = width - labelW - right;
  const t0 = Date.parse(start), t1 = Date.parse(end);
  const x = (d: DateStr) => labelW + Math.min(1, Math.max(0, (Date.parse(d) - t0) / (t1 - t0))) * plotW;
  const lanes = rules.map((ar) => {
    const ctxStarts = Object.values(ar.rule.timing.context_effective_dates ?? {}).filter(Boolean) as DateStr[];
    const eff = ar.rule.timing.effective_date;
    const full = eff && ar.rule.timing.transition_years ? addYears(eff, ar.rule.timing.transition_years) : null;
    return { ar, eff, full, ctxStarts };
  });
  const h = top + lanes.length * rowH + 26;
  const years: string[] = [];
  for (let y = Number(start.slice(0, 4)) + 1; y <= Number(end.slice(0, 4)); y++) years.push(`${y}-01-01`);
  return (
    <div className="chart" ref={ref}>
      <div className="legend">
        <span><i className="sw sw-lane" />Enacted</span>
        <span><i className="sw sw-hatch" />Proposed or introduced</span>
        <span><i className="sw sw-sparse" />Reported or rumored</span>
        <span><i className="sw sw-dash" />Transition period</span>
        <span><i className="sw sw-dot" />Status change</span>
      </div>
      <svg width={width} height={h} role="img" aria-label="When each rule takes effect">
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--lane-bg)" /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--lane-solid)" strokeWidth="2.5" />
          </pattern>
          <pattern id="hatch-sparse" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
            <rect width="8" height="8" fill="var(--lane-bg)" /><line x1="0" y1="0" x2="0" y2="8" stroke="var(--lane-solid)" strokeWidth="1.5" />
          </pattern>
        </defs>
        {years.map((y) => <g key={y}><line x1={x(y)} x2={x(y)} y1={top - 4} y2={h - 22} className="grid" /><text x={x(y) + 3} y={h - 8} className="ax">{y.slice(0, 4)}</text></g>)}
        {lanes.map(({ ar, eff, full, ctxStarts }, i) => {
          const y = top + i * rowH;
          const st = ar.instrument.legal_status;
          const showTip = (e: RME) => setTip({ x: e.nativeEvent.offsetX + 12, y: e.nativeEvent.offsetY - 10, body: <>
            <b>{RULE_SHORT[ar.rule.id] ?? ar.instrument.name}</b><br />{LEGAL_PLAIN[st]} · likelihood {Math.round(ar.likelihood * 100)}%<br />
            {eff ? <>Effective {monthLabel(eff)}{full ? <>; full effect {monthLabel(full)}</> : null}</> : <>No effective date in this case</>}</> });
          return (
            <g key={ar.rule.id} className="clickable" onClick={() => onPickRule(ar.rule.id)} onMouseMove={showTip} onMouseLeave={() => setTip(null)}>
              <rect x={0} y={y} width={width} height={rowH - 2} fill="transparent" />
              <text x={0} y={y + 18} className="ax-strong">{ar.rule.id}</text>
              <text x={58} y={y + 18} className="ax">{trim(RULE_SHORT[ar.rule.id] ?? ar.instrument.name, Math.floor((labelW - 64) / 6.4))}</text>
              {eff && !full && <rect x={x(eff)} y={y + 6} width={Math.max(2, x(end) - x(eff))} height={16} rx={2} fill={STATUS_FILL[st]} />}
              {eff && full && <>
                <rect x={x(eff)} y={y + 6} width={Math.max(2, x(full) - x(eff))} height={16} rx={2} fill="none" className="dashbox" />
                <rect x={x(full)} y={y + 6} width={Math.max(2, x(end) - x(full))} height={16} rx={2} fill={STATUS_FILL[st]} />
              </>}
              {ctxStarts.map((d) => <line key={d} x1={x(d)} x2={x(d)} y1={y + 3} y2={y + 25} className="tick" />)}
              {ar.instrument.status_history.map((s) => <circle key={s.date + s.status} cx={x(s.date)} cy={y + 14} r={4.5} className="dot" />)}
              {!eff && <text x={x("2027-04-01")} y={y + 18} className="ax-dim">no effective date in this case</text>}
            </g>
          );
        })}
        {cursor && <g><line x1={x(cursor)} x2={x(cursor)} y1={top - 6} y2={h - 22} className="cursor" /></g>}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

const trim = (s: string, n: number) => (s.length > n ? s.slice(0, Math.max(4, n - 1)) + "…" : s);

// ---------------------------------------------------------------- lever deltas (diverging bars)

export function DeltaBars({ rows }: { rows: { id: string; delta: number }[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip | null>(null);
  const labelW = 60, pad = 56, rowH = 30;
  const max = Math.max(0.01, ...rows.map((r) => Math.abs(r.delta)));
  const mid = labelW + (width - labelW) / 2;
  const half = (width - labelW) / 2 - pad;
  const h = rows.length * rowH + 22;
  return (
    <div className="chart" ref={ref}>
      <div className="legend"><span><i className="sw sw-clear" />Reduced risk</span><span><i className="sw sw-block" />Increased risk</span></div>
      <svg width={width} height={h} role="img" aria-label="Change in weighted risk by wave">
        <line x1={mid} x2={mid} y1={0} y2={h - 18} className="zero" />
        <text x={mid} y={h - 4} textAnchor="middle" className="ax">0</text>
        {rows.map((r, i) => {
          const y = i * rowH + 4;
          const len = (Math.abs(r.delta) / max) * half;
          const x0 = r.delta < 0 ? mid - len : mid;
          return (
            <g key={r.id} onMouseMove={(e) => setTip({ x: e.nativeEvent.offsetX + 12, y: e.nativeEvent.offsetY - 10, body: <><b>{r.id}</b><br />Δ weighted risk {r.delta > 0 ? "+" : ""}{r.delta.toFixed(2)}</> })}
              onMouseLeave={() => setTip(null)}>
              <text x={0} y={y + 15} className="ax-strong">{r.id}</text>
              {r.delta !== 0 && <rect x={x0} y={y + 3} width={Math.max(2, len)} height={16} rx={2} fill={r.delta < 0 ? "var(--c-clear)" : "var(--c-block)"} />}
              <text x={r.delta < 0 ? x0 - 6 : x0 + len + 6} y={y + 15} textAnchor={r.delta < 0 ? "end" : "start"} className="ax">
                {r.delta === 0 ? "no change" : `${r.delta > 0 ? "+" : "−"}${Math.abs(r.delta).toFixed(2)}`}
              </text>
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}
