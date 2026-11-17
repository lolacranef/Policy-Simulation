import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ProductCategory, Status } from "../model/types";
import { STATUS_PLAIN } from "./plain";

export const STATUS_LABEL: Record<Status, string> = {
  CLEAR: "Clear", WATCH: "Watch", APPROVAL_EXPIRING: "Approval expiring", AT_RISK: "At risk",
  LICENSE_REQUIRED: "License required", LICENSE_REQUIRED_TENANT: "Tenant license",
  BLOCKED_DOD: "Blocked · DoD", BLOCKED_FEDERAL: "Blocked · federal", BLOCKED_EXPORT: "Blocked · export", BLOCKED_NEW_AUTH: "Blocked · new auth",
};

export type Bucket = "block" | "lic" | "watch" | "clear";
export const BUCKETS: Bucket[] = ["block", "lic", "watch", "clear"];
export const BUCKET_LABEL: Record<Bucket, string> = { block: "Barred", lic: "License required", watch: "Monitor", clear: "Clear" };
export const bucketOf = (s: Status): Bucket =>
  s.startsWith("BLOCKED") ? "block" : s.startsWith("LICENSE") ? "lic" : s === "CLEAR" ? "clear" : "watch";
export const chipClass = (s: Status) =>
  s.startsWith("BLOCKED") ? "block" : s.startsWith("LICENSE") ? "lic" : s === "AT_RISK" || s === "APPROVAL_EXPIRING" ? "risk" : s === "WATCH" ? "watch" : "clear";

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  OPTICAL_TRANSCEIVER: "Optical transceivers", SWITCH: "Switches", SERVER: "GPU servers", ROUTER_CONSUMER: "Edge routers",
  ROUTER_ENTERPRISE: "Enterprise routers", POWER_INVERTER_CONNECTED: "Connected inverters", NIC: "NICs", BMC: "BMCs", PSU: "Power supplies", OTHER: "Other",
};

export const ym = (d: string) => d.slice(0, 7);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthLabel = (d: string) => `${MON[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

export function Chip({ status }: { status: Status }) {
  return <span className={`chip ${chipClass(status)}`}>{STATUS_PLAIN[status]}</span>;
}

/** Measures an element's width so SVG charts draw at true pixel size (no stretched text). */
export function useWidth<T extends HTMLElement>(fallback = 800) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export interface Tip { x: number; y: number; body: ReactNode }

export function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return <div className="tooltip" role="status" style={{ left: tip.x, top: tip.y }}>{tip.body}</div>;
}

export function Legend({ items }: { items: Bucket[] }) {
  return (
    <div className="legend" aria-label="Legend">
      {items.map((b) => <span key={b}><i className={`sw sw-${b}`} />{BUCKET_LABEL[b]}</span>)}
    </div>
  );
}
