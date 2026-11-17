// Acceptance checks for seed scenario 2 (SPECIFICATIONS §7B.4).
import { describe, expect, it } from "vitest";
import { OPTICS_SCENARIO, REMOTE_ACCESS_SCENARIO } from "../src/data/seed";
import { evaluate } from "../src/engine/evaluate";
import { applyLevers } from "../src/engine/levers";
import { cell, input, run } from "./helpers";

const ra = (branch = "as-issued", date: string | null = null) => run({ optics: null, remote: branch, date });

describe("§7B.4.1 smuggling-risk HQ", () => {
  it("W5 and W6 GPU lines need a license from +90 days because the operator is HQ'd in Singapore", () => {
    for (const w of ["W5", "W6"]) {
      expect(cell(ra("as-issued", "2027-02-13"), w, "SRV-GPU-SEA").status).toBe("CLEAR");
      const c = cell(ra("as-issued", "2027-02-14"), w, "SRV-GPU-SEA");
      expect(c.status).toBe("LICENSE_REQUIRED");
      expect(c.triggered_rules).toContain("RA2");
    }
  });
  it("US-operated waves are not affected", () => {
    expect(cell(ra(), "W1", "SRV-GPU-1").status).toBe("CLEAR");
  });
  it("APPLY_VEU clears it after the assumed approval, marked as assumed", () => {
    const { input: after } = applyLevers(input({ optics: null, remote: "as-issued" }), [{ kind: "APPLY_VEU", wave_id: "W5", assumed_approval_date: "2027-03-01" }]);
    const c = cell(evaluate(after), "W5", "SRV-GPU-SEA");
    expect(c.status).toBe("CLEAR");
    expect(c.flags).toContain("ASSUMED_CARVE_OUT");
  });
});

describe("§7B.4.2 T4 above threshold", () => {
  it("is LICENSE_REQUIRED_TENANT; TENANT_CAP below the threshold gives WATCH, not CLEAR", () => {
    expect(cell(ra(), "W6", "T4").status).toBe("LICENSE_REQUIRED_TENANT");
    const { input: after } = applyLevers(input({ optics: null, remote: "as-issued" }), [{ kind: "TENANT_CAP", tenant_id: "T4", max_gpu_hours: 200000 }]);
    expect(cell(evaluate(after), "W6", "T4").status).toBe("WATCH");
  });
  it("OFFBOARD_TENANT clears it from the offboarding date", () => {
    const { input: after } = applyLevers(input({ optics: null, remote: "as-issued" }), [{ kind: "OFFBOARD_TENANT", tenant_id: "T4", date: "2027-12-01" }]);
    expect(cell(evaluate(after), "W6", "T4").status).toBe("CLEAR");
  });
  it("flags the tenant for license-application disclosure (RA4)", () => {
    expect(cell(ra(), "W6", "T4").flags).toContain("DISCLOSURE_REQUIRED");
  });
});

describe("§7B.4.3 T2 ownership change", () => {
  it("shows RECENT_OWNERSHIP_CHANGE without changing the legal status", () => {
    const c = cell(ra(), "W5", "T2");
    expect(c.flags).toContain("RECENT_OWNERSHIP_CHANGE");
    expect(c.status).toBe("CLEAR");
  });
  it("drops the flag once the change is older than the 36-month lookback", () => {
    expect(cell(ra("as-issued", "2027-07-01"), "W5", "T2").flags).not.toContain("RECENT_OWNERSHIP_CHANGE");
  });
});

describe("§7B.4.4 T3 unverified KYC", () => {
  it("is WATCH, never CLEAR, across the horizon", () => {
    for (const d of ["2027-02-14", "2028-01-01", "2031-06-01"]) expect(cell(ra("as-issued", d), "W5", "T3").status).toBe("WATCH");
  });
});

describe("§7B.4.5 Megaspeed listed", () => {
  it("blocks every line and tenant whose path passes through a Megaspeed-affiliated node", () => {
    const ex = ra("megaspeed-listed");
    expect(cell(ex, "W5", "SRV-GPU-SEA").status).toBe("BLOCKED_EXPORT");
    expect(cell(ex, "W6", "SRV-GPU-SEA").status).toBe("BLOCKED_EXPORT");
    // The channel partner is a Sayari-recorded Megaspeed subsidiary, so the block runs through ownership.
    expect(cell(ex, "W5", "SRV-GPU-SEA").path).toEqual(["SRV-GPU-SEA", "SEA-BROKER", "ENT-MEGASPEED"]);
    // Tenants are hypothetical and none is linked to Megaspeed; the unverified one stays on Monitor.
    expect(cell(ex, "W5", "T3").status).toBe("WATCH");
    expect(cell(ex, "W5", "T1").status).toBe("CLEAR");
    expect(cell(ex, "W1", "SRV-GPU-1").status).toBe("CLEAR");
  });
});

describe("§7B.4.6 cross-scenario", () => {
  it("W6 optics pick up the transceiver-scenario exposure when both scenarios are loaded", () => {
    const both = evaluate({ ...input({ remote: "as-issued" }), scenarios: [
      { bundle: OPTICS_SCENARIO, branch_id: "as-reported" }, { bundle: REMOTE_ACCESS_SCENARIO, branch_id: "as-issued" }] });
    const opt = cell(both, "W6", "XCVR-A-3200");
    expect(opt.hits.some((h) => h.rule_id === "R2")).toBe(true);
    expect(opt.flags).toContain("OUT_OF_JURISDICTION");
    expect(opt.status).toBe("WATCH");
    expect(cell(both, "W6", "SRV-GPU-SEA").status).toBe("LICENSE_REQUIRED");
    expect(cell(ra(), "W6", "XCVR-A-3200").status).toBe("CLEAR");
  });
  it("a wave marked as inside FCC jurisdiction gets the full block", () => {
    const base = input({ remote: "as-issued" });
    const waves = base.waves.map((w) => (w.id === "W6" ? { ...w, fcc_jurisdiction: true } : w));
    expect(cell(evaluate({ ...base, waves }), "W6", "XCVR-A-3200").status).toBe("BLOCKED_NEW_AUTH");
  });
});

describe("other branches and events", () => {
  it("Tightened threshold catches smaller tenants", () => {
    expect(cell(ra("tightened"), "W6", "T4").status).toBe("LICENSE_REQUIRED_TENANT");
  });
  it("Rolled back removes the licensing requirements", () => {
    const ex = ra("rolled-back");
    expect(cell(ex, "W5", "SRV-GPU-SEA").status).toBe("CLEAR");
    expect(cell(ex, "W6", "T4").status).toBe("CLEAR");
  });
  it("an is-informed notice blocks the named item from its date", () => {
    const bundle = structuredClone(REMOTE_ACCESS_SCENARIO);
    bundle.scenario.events = [{ id: "EV1", rule_id: "RA6", date: "2027-06-01", target_part_id: "SRV-GPU-SEA", note: "test" }];
    const base = { ...input({ optics: null }), scenarios: [{ bundle, branch_id: "as-issued" }] };
    expect(cell(evaluate({ ...base, date: "2027-05-31" }), "W5", "SRV-GPU-SEA").status).toBe("LICENSE_REQUIRED");
    expect(cell(evaluate({ ...base, date: "2027-06-01" }), "W5", "SRV-GPU-SEA").status).toBe("BLOCKED_EXPORT");
  });
});
