import { describe, expect, it } from "vitest";
import { SEED_FILES } from "../src/data/seed";
import { parseCsv } from "../src/import/csv";
import { importDataset } from "../src/import/importer";

describe("CSV parser", () => {
  it("handles quotes, embedded commas and CRLF", () => {
    const rows = parseCsv('a,b\r\n"x, y","say ""hi"""\r\n1,2\n');
    expect(rows).toEqual([{ a: "x, y", b: 'say "hi"' }, { a: "1", b: "2" }]);
  });
});

describe("seed import (§5)", () => {
  const r = importDataset(SEED_FILES, "ILLUSTRATIVE");

  it("loads with no errors", () => {
    expect(r.issues.filter((i) => i.level === "error")).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("writes the summary the spec asks for", () => {
    expect(r.summary.parts_loaded).toBe(21);
    expect(r.summary.nodes).toBeGreaterThan(30);
    expect(r.summary.unresolved_owners).toContain("T3-PARENT");
    expect(r.summary.lines_without_evidence).toEqual([]);
  });

  it("warns, not errors, on missing Sayari IDs", () => {
    const w = r.issues.filter((i) => i.message.includes("Sayari"));
    expect(w.length).toBeGreaterThan(0);
    expect(w.every((i) => i.level === "warning")).toBe(true);
  });
});

describe("import validation", () => {
  const swap = (file: keyof typeof SEED_FILES, from: string, to: string) => {
    const text = SEED_FILES[file]!;
    if (!text.includes(from)) throw new Error(`fixture text not found: ${from}`);
    return { ...SEED_FILES, [file]: text.replace(from, to) };
  };

  it("rejects us_value_low > estimate", () => {
    const r = importDataset(swap("parts.csv", "0.18,0.12,0.25", "0.18,0.30,0.25"));
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.message.includes("us_value_low ≤ us_value_est ≤ us_value_high"))).toBe(true);
  });

  it("rejects a list flag without a date", () => {
    const r = importDataset(swap("entities.csv", "1260h,2026-06-08", "1260h,"));
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.message.includes("Every flag needs a date"))).toBe(true);
  });

  it("rejects an edge with no evidence row", () => {
    const r = importDataset(swap("supplier_edges.csv", "EV-SEED-WEAK,D4", "EV-MISSING,D4"));
    expect(r.issues.some((i) => i.level === "error" && i.message.includes("no matching row in evidence.csv"))).toBe(true);
  });

  it("rejects a logic-bearing node with no entity row", () => {
    const r = importDataset(swap("supplier_edges.csv", "XCVR-A-800,CMP-DSP-TW", "XCVR-A-800,CMP-UNKNOWN"));
    expect(r.issues.some((i) => i.message.includes('Logic-bearing node "CMP-UNKNOWN"'))).toBe(true);
  });

  it("reports missing columns", () => {
    const r = importDataset({ ...SEED_FILES, "parts.csv": "part_id,sku\nX,Y\n" });
    expect(r.issues.some((i) => i.file === "parts.csv" && i.message.startsWith("Missing columns"))).toBe(true);
  });
});
