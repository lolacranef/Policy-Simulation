// Display copy for a graduate-level audience: precise terms of art, with the engine's codes available under "Technical detail".
import type { Context, EvidenceGrade, Flag, LegalStatus, ProductCategory, Segment, Status } from "../model/types";

export const STATUS_PLAIN: Record<Status, string> = {
  CLEAR: "Clear",
  WATCH: "Monitor",
  APPROVAL_EXPIRING: "Conditional Approval expiring",
  AT_RISK: "Exposed",
  LICENSE_REQUIRED: "License required",
  LICENSE_REQUIRED_TENANT: "Tenant license required",
  BLOCKED_DOD: "Barred: DoD",
  BLOCKED_FEDERAL: "Barred: federal NSS",
  BLOCKED_EXPORT: "Export prohibited",
  BLOCKED_NEW_AUTH: "Barred: FCC authorization",
};

export const CATEGORY_PLAIN: Record<ProductCategory, string> = {
  OPTICAL_TRANSCEIVER: "Optical transceivers",
  SWITCH: "Network switches",
  SERVER: "GPU servers",
  ROUTER_CONSUMER: "Consumer-grade routers",
  ROUTER_ENTERPRISE: "Enterprise routers",
  POWER_INVERTER_CONNECTED: "Connected power inverters",
  NIC: "Network interface cards",
  BMC: "Baseboard management controllers",
  PSU: "Power supply units",
  OTHER: "Other",
};

export const CATEGORY_HELP: Partial<Record<ProductCategory, string>> = {
  OPTICAL_TRANSCEIVER: "Pluggable or co-packaged electro-optical modules; Chinese vendors hold roughly 60% of datacom revenue.",
  SWITCH: "Leaf, spine and co-packaged-optics switches. Brand is irrelevant under FCC 26-50; the producer of each logic-bearing component governs.",
  SERVER: "Accelerated compute nodes; the export-control object of the BIS remote-access rule.",
  ROUTER_CONSUMER: "Branch and remote-site kits within the scope of the DA 26-278 Covered List entry.",
  POWER_INVERTER_CONNECTED: "On-site storage and solar power conversion within the scope of DA 26-786.",
};

export const SEGMENT_PLAIN: Record<Segment, string> = {
  COMMERCIAL: "commercial",
  FEDERAL_NSS: "federal national security systems",
  DOD: "Department of Defense",
  MIXED: "mixed commercial and federal",
};

export const COUNTRY: Record<string, string> = {
  USA: "United States", CHN: "China", MYS: "Malaysia", IDN: "Indonesia", SGP: "Singapore", THA: "Thailand", TWN: "Taiwan",
  VNM: "Vietnam", JPN: "Japan", RUS: "Russia", IRN: "Iran", BRA: "Brazil", PRK: "North Korea",
};
export const country = (c: string) => COUNTRY[c] ?? (c || "unresolved");

export const CONTEXT_PLAIN: Record<Context, string> = {
  NEW_FCC_AUTHORIZATION: "new FCC equipment authorization",
  IMPORT_MARKETING: "importation and marketing",
  FEDERAL_NSS_PROCUREMENT: "federal national security system procurement",
  DOD_CONTRACTING: "DoD direct contracting",
  DOD_PROCUREMENT_GOODS: "DoD procurement of goods",
  FIRMWARE_UPDATES: "software and firmware updates to the installed base",
  ALL: "all transactions (Entity List)",
  EXPORT_LICENSE_CHIPS: "export licensing of advanced computing items",
  REMOTE_ACCESS_IAAS: "IaaS remote access",
  IS_INFORMED_NOTICE: "\"is-informed\" notice",
};

export const LEGAL_PLAIN: Record<LegalStatus, string> = {
  ENACTED: "Enacted",
  PROPOSED: "Proposed",
  INTRODUCED: "Introduced",
  REPORTED: "Reported",
  RUMORED: "Rumored",
  WITHDRAWN: "Withdrawn",
};

export const FLAG_PLAIN: Record<Flag, string> = {
  RECENT_OWNERSHIP_CHANGE: "Recent change of control",
  OUT_OF_JURISDICTION: "Outside FCC jurisdiction",
  DISCLOSURE_REQUIRED: "Disclosure required",
  ASSUMED_CARVE_OUT: "Assumed carve-out",
  OFFBOARDED: "Offboarded",
};

export const RULE_SHORT: Record<string, string> = {
  R1: "FCC 26-50 component rule", "R1-FW": "Third FNPRM (firmware)", R2: "Reported transceiver draft", "R2-LIST": "Optics makers on Covered List",
  R3: "S.5548", R4: "Section 1260H list", R5: "DA 26-278 (routers)", R6: "DA 26-786 (inverters)",
  RA1: "BIS IFR: remote access", RA2: "BIS IFR: smuggling-risk HQ", RA3: "BIS guidance: China-HQ firms", RA4: "IaaS end-user disclosure",
  RA5: "Entity List: Megaspeed", RA6: "\"Is-informed\" notices",
};

export const RULE_PLAIN: Record<string, string> = {
  R1: "Bars new FCC equipment authorizations for any device containing a logic-bearing hardware component produced by a Covered List entity. Effective 13 October 2026; existing authorizations are unaffected, and the brand of the finished device is immaterial.",
  "R1-FW": "Proposed in the Third FNPRM: extends the bar to software and firmware from Covered List entities, which would reach the installed base through updates. Adoption and timing are unknown and are set by branch.",
  R2: "Reported by Reuters from unnamed sources; no FCC text exists. Would bar new authorizations for transceiver models from Chinese producers at 3.2T and above, exempting modules with at least 65% US-sourced BOM value, a figure that mirrors the domestic end product threshold.",
  "R2-LIST": "Rumored Covered List designation of InnoLight, Eoptolink, Dongshan Precision and TFC, together with affiliates. Would trigger the R1 component bar for any device containing their optical engines.",
  R3: "Introduced 24 September 2026 and referred to HSGAC. Would prohibit federal national security systems from using optics from InnoLight, Eoptolink, their subsidiaries and affiliates, and later designees, after a five-year transition.",
  R4: "InnoLight was added to the Section 1260H list on 8 June 2026. DoD direct contracting is barred from 30 June 2026 and procurement of the entity's goods from 30 June 2027.",
  R5: "Covered List entry for foreign-produced consumer-grade routers (23 March 2026). New authorizations are barred absent a DoW/DHS Conditional Approval of up to 18 months. Enterprise routing equipment is likely out of scope.",
  R6: "Covered List entry for foreign-produced connected power inverters (28 July 2026), with carve-outs for domestic end products and Conditional Approvals.",
  RA1: "Licensing requirement on advanced-chip sales to overseas data centers that provide significant computing volume to tenants whose ultimate parent is headquartered in a country of concern. The volume threshold is a placeholder pending the Federal Register text.",
  RA2: "Licensing requirement on exports of advanced chips to companies headquartered in Indonesia, Malaysia, Singapore, Thailand or Brazil, designated as elevated diversion risk. Effective 90 days from issuance.",
  RA3: "May 2026 guidance: the November 2023 licensing requirement applies worldwide to China-headquartered firms and their subsidiaries.",
  RA4: "Since January 2026, license applications must disclose IaaS remote end users whose parent is headquartered in a listed country, along with the consignee's KYC procedures. Affects application content, not license necessity.",
  RA5: "Branch assumption: Megaspeed and its affiliates are added to the Entity List, consistent with the position Treasury attributes to several agencies. Not listed as of the intelligence date.",
  RA6: "Discretionary authority to impose a license requirement on a named item or party by notice, which may be oral. Modeled as discrete timeline events.",
};

export const BRANCH_PLAIN: Record<string, { name: string; text: string }> = {
  "as-reported": { name: "As reported", text: "R2 effective 1 January 2027 with the 65% US-content carve-out; S.5548 enacted mid-2027." },
  delayed: { name: "Delayed 12 months", text: "R2 effective 1 January 2028; S.5548 not enacted." },
  broadened: { name: "Broadened", text: "R2 extends to 1.6T without a carve-out and under either definition of Chinese; the four optics makers are designated; the firmware rule takes effect July 2027." },
  dropped: { name: "Dropped", text: "Only enacted instruments apply: the present-day exposure floor." },
  "as-issued": { name: "As issued", text: "IFR effective 14 February 2027, 90 days after issuance." },
  "megaspeed-listed": { name: "Megaspeed listed", text: "Megaspeed and affiliates added to the Entity List, 1 March 2027." },
  tightened: { name: "Tightened threshold", text: "The significant-volume threshold is set at 50,000 GPU-hours per month, capturing most multi-tenant clouds in the region." },
  "rolled-back": { name: "Rolled back", text: "The remote-access and smuggling-risk licensing requirements are withdrawn." },
};

export const SCENARIO_PLAIN: Record<string, { name: string; text: string }> = {
  "SCN-OPTICS-2026": { name: "Scenario 1 · Optics & Covered List", text: "FCC, congressional and DoW instruments targeting Chinese optical-module supply, 2026." },
  "SCN-REMOTE-ACCESS-2026": { name: "Scenario 2 · Remote access", text: "The November 2026 BIS interim final rule on IaaS access to advanced compute." },
};

/** Confidence in words, from the engine's weakest-link confidence score. */
export function sureness(g: EvidenceGrade): { label: string; level: 1 | 2 | 3 | 4; why: string } {
  const c = g.confidence;
  const level = c >= 0.75 ? 4 : c >= 0.5 ? 3 : c >= 0.25 ? 2 : 1;
  const label = ["", "Speculative", "Low confidence", "Moderate confidence", "High confidence"][level];
  const why = g.no_primary_source
    ? `The instrument is ${LEGAL_PLAIN[g.legal_status].toLowerCase()} with no primary source; the assessment rests on secondary reporting.`
    : g.legal_status === "ENACTED" ? "The instrument is enacted and documented in a primary source."
    : `The instrument is ${LEGAL_PLAIN[g.legal_status].toLowerCase()} and its terms may change before adoption.`;
  return { label, level: level as 1 | 2 | 3 | 4, why };
}
