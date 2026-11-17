// A rotatable 3D sketch of one data hall, drawn on canvas with a painter's-algorithm box renderer (no library).
import { useEffect, useRef } from "react";

export type PartKey = "gpu" | "tor" | "spine" | "optics" | "cooling" | "bess" | "router";

interface Box { x: number; y: number; z: number; w: number; d: number; h: number; part: PartKey }

const BASE: Record<PartKey, string> = {
  gpu: "#5a2530", tor: "#8a6a3c", spine: "#7a3f4a", optics: "#d9b064", cooling: "#4f6470", bess: "#5d5a4a", router: "#9b7f6a",
};

function buildScene(): Box[] {
  const b: Box[] = [];
  const rows = [-6.2, -2.4, 2.4, 6.2];
  for (const y of rows) {
    for (let x = -13; x <= 9.5; x += 1.5) {
      b.push({ x, y, z: 0, w: 1.25, d: 1.8, h: 4, part: "gpu" });
      b.push({ x, y, z: 4, w: 1.25, d: 1.8, h: 0.45, part: "tor" });
    }
    b.push({ x: -13.3, y: y - 0.25, z: 5.3, w: 26.3, d: 0.5, h: 0.22, part: "optics" });
  }
  b.push({ x: 11.6, y: -7, z: 5.3, w: 0.5, d: 15, h: 0.22, part: "optics" });
  for (let y = -6.6; y <= 5.4; y += 2.4) b.push({ x: 12.6, y, z: 0, w: 1.6, d: 1.9, h: 4.8, part: "spine" });
  for (let x = -12; x <= 8; x += 6.5) b.push({ x, y: 10.4, z: 0, w: 4.2, d: 1.4, h: 3, part: "cooling" });
  for (let x = -10; x <= 8; x += 9) b.push({ x, y: 14.5, z: 0, w: 6.5, d: 2.6, h: 2.4, part: "cooling" });
  for (let y = -8; y <= 4; y += 4.5) {
    b.push({ x: 19, y, z: 0, w: 6, d: 2.6, h: 2.8, part: "bess" });
    b.push({ x: 25.6, y: y + 0.5, z: 0, w: 1.4, d: 1.6, h: 2.2, part: "bess" });
  }
  b.push({ x: -22, y: 8, z: 0, w: 2.4, d: 2.4, h: 1.8, part: "router" });
  b.push({ x: -21.2, y: 8.8, z: 1.8, w: 0.8, d: 0.8, h: 0.5, part: "router" });
  b.push({ x: -20.9, y: 9.1, z: 2.3, w: 0.15, d: 0.15, h: 2.2, part: "router" });
  return b;
}

const SCENE = buildScene();
const FLOOR = { x0: -15.5, x1: 15.5, y0: -9.5, y1: 12 };

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

export function DataCenterModel(props: {
  selected: PartKey | null; onPick: (p: PartKey) => void; colors?: Partial<Record<PartKey, string>>; paused: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ yaw: -0.6, drag: false, lastX: 0, moved: 0, hover: null as PartKey | null });
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let hitList: { part: PartKey; poly: [number, number][] }[] = [];
    const elev = 0.62, ce = Math.cos(elev), se = Math.sin(elev);

    const draw = () => {
      const { selected, colors } = propsRef.current;
      const st = state.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = cv.clientWidth, H = cv.clientHeight;
      if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const s = Math.min(W / 58, H / 34);
      const cx = W / 2, cy = H * 0.62;
      const cy0 = Math.cos(st.yaw), sy0 = Math.sin(st.yaw);
      const P = (x: number, y: number, z: number): [number, number, number] => {
        const xr = x * cy0 - y * sy0, yr = x * sy0 + y * cy0;
        return [cx + xr * s, cy - (z * ce + yr * se) * s, yr * ce - z * se];
      };
      // floor
      const f = [P(FLOOR.x0, FLOOR.y0, 0), P(FLOOR.x1, FLOOR.y0, 0), P(FLOOR.x1, FLOOR.y1, 0), P(FLOOR.x0, FLOOR.y1, 0)];
      ctx.beginPath(); f.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      ctx.fillStyle = "rgba(217,176,100,0.06)"; ctx.fill(); ctx.strokeStyle = "rgba(217,176,100,0.35)"; ctx.lineWidth = 1; ctx.stroke();
      // grid on floor
      ctx.strokeStyle = "rgba(217,176,100,0.08)";
      for (let gx = FLOOR.x0; gx <= FLOOR.x1; gx += 3) { const a = P(gx, FLOOR.y0, 0), b = P(gx, FLOOR.y1, 0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      for (let gy = FLOOR.y0; gy <= FLOOR.y1; gy += 3) { const a = P(FLOOR.x0, gy, 0), b = P(FLOOR.x1, gy, 0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }

      const items = SCENE.map((bx) => ({ bx, depth: P(bx.x + bx.w / 2, bx.y + bx.d / 2, bx.z + bx.h / 2)[2] }))
        .sort((a, b) => b.depth - a.depth);
      hitList = [];
      for (const { bx } of items) {
        const dim = selected && selected !== bx.part;
        const hot = selected === bx.part || st.hover === bx.part;
        const base = colors?.[bx.part] ?? BASE[bx.part];
        ctx.globalAlpha = dim ? 0.22 : 1;
        const c = [
          P(bx.x, bx.y, bx.z), P(bx.x + bx.w, bx.y, bx.z), P(bx.x + bx.w, bx.y + bx.d, bx.z), P(bx.x, bx.y + bx.d, bx.z),
          P(bx.x, bx.y, bx.z + bx.h), P(bx.x + bx.w, bx.y, bx.z + bx.h), P(bx.x + bx.w, bx.y + bx.d, bx.z + bx.h), P(bx.x, bx.y + bx.d, bx.z + bx.h),
        ];
        // vertical faces: [indices], outward normal in world xy
        const faces: [number[], number, number][] = [[[0, 1, 5, 4], 0, -1], [[1, 2, 6, 5], 1, 0], [[2, 3, 7, 6], 0, 1], [[3, 0, 4, 7], -1, 0]];
        const poly = (idx: number[], fill: string) => {
          ctx.beginPath(); idx.forEach((k, i) => (i ? ctx.lineTo(c[k][0], c[k][1]) : ctx.moveTo(c[k][0], c[k][1]))); ctx.closePath();
          ctx.fillStyle = fill; ctx.fill();
          ctx.strokeStyle = hot ? "rgba(246,236,220,0.9)" : "rgba(0,0,0,0.35)"; ctx.lineWidth = hot ? 1.4 : 0.6; ctx.stroke();
        };
        for (const [idx, nx, ny] of faces) {
          const nyr = nx * sy0 + ny * cy0;
          if (nyr < 0) poly(idx, shade(base, 0.55 + 0.25 * Math.abs(nx * cy0 - ny * sy0)));
        }
        poly([4, 5, 6, 7], shade(base, hot ? 1.35 : 1.12));
        ctx.globalAlpha = 1;
        const hull = c.map(([x, y]) => [x, y] as [number, number]);
        hitList.push({ part: bx.part, poly: hull });
      }
    };

    const loop = () => {
      if (!propsRef.current.paused && !state.current.drag && !reduce) state.current.yaw += 0.0025;
      draw();
      raf = requestAnimationFrame(loop);
    };
    loop();

    const inside = (pt: [number, number], pts: [number, number][]) => {
      // bounding box test is enough for picking boxes this small
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      return pt[0] >= Math.min(...xs) && pt[0] <= Math.max(...xs) && pt[1] >= Math.min(...ys) && pt[1] <= Math.max(...ys);
    };
    const pick = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const pt: [number, number] = [e.clientX - r.left, e.clientY - r.top];
      for (let i = hitList.length - 1; i >= 0; i--) if (inside(pt, hitList[i].poly)) return hitList[i].part;
      return null;
    };
    const down = (e: PointerEvent) => { state.current.drag = true; state.current.lastX = e.clientX; state.current.moved = 0; cv.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      const st = state.current;
      if (st.drag) { const dx = e.clientX - st.lastX; st.yaw += dx * 0.008; st.moved += Math.abs(dx); st.lastX = e.clientX; }
      else { const p = pick(e); st.hover = p; cv.style.cursor = p ? "pointer" : "grab"; }
    };
    const up = (e: PointerEvent) => {
      const st = state.current; st.drag = false;
      if (st.moved < 4) { const p = pick(e); if (p) propsRef.current.onPick(p); }
    };
    const leave = () => { state.current.hover = null; };
    cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up); cv.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointerdown", down); cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up); cv.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <canvas ref={ref} className="dc-canvas" role="img" aria-label="Rotating 3D sketch of a data hall: GPU server rows with top-of-rack switches, overhead fiber trays carrying optical transceivers, a spine switch row, cooling units, a battery storage yard and a remote-site router. Select a part to see its exposure." />;
}
