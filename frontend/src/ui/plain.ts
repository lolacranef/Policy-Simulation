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
  RA1: "BIS IFR: remote access", RA2: "BIS IFR: diversion-risk HQ", RA3: "BIS guidance: China-HQ firms", RA4: "IaaS end-user disclosure",
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
  RA5: "Case assumption: Megaspeed and its affiliates are added to the Entity List, consistent with the position Treasury attributes to several agencies. Not listed as of the intelligence date.",
  RA6: "Discretionary authority to impose a license requirement on a named item or party by notice, which may be oral. Modeled as discrete timeline events.",
};

export const BRANCH_PLAIN: Record<string, { name: string; text: string }> = {
  "as-reported": { name: "As reported", text: "R2 effective 1 January 2027 with the 65% US-content carve-out; S.5548 enacted mid-2027." },
  delayed: { name: "Delayed 12 months", text: "R2 effective 1 January 2028; S.5548 not enacted." },
  broadened: { name: "Broadened", text: "R2 extends to 1.6T without a carve-out and under either definition of Chinese; the four optics makers are designated; the firmware rule takes effect July 2027." },
  dropped: { name: "Dropped", text: "Only enacted instruments apply: the present-day baseline." },
  "as-issued": { name: "As issued", text: "IFR effective 14 February 2027, 90 days after issuance." },
  "megaspeed-listed": { name: "Megaspeed listed", text: "Megaspeed and affiliates added to the Entity List, 1 March 2027." },
  tightened: { name: "Tightened threshold", text: "The significant-volume threshold is set at 50,000 GPU-hours per month, capturing most multi-tenant clouds in the region." },
  "rolled-back": { name: "Rolled back", text: "The remote-access and diversion-risk licensing requirements are withdrawn." },
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

export interface RuleExplained {
  what: string;        // one-sentence statement of the restriction
  targets: string;     // who or what is restricted
  covers: string;      // products or activities in scope
  where: string;       // the transaction it bites on
  exceptions: string;  // carve-outs, or "None"
  matters: string;     // implication for a data-center build
}

export const RULE_EXPLAINED: Record<string, RuleExplained> = {
  R1: {
    what: "No new FCC equipment authorization for a device that contains a logic-bearing component made by a Covered List entity.",
    targets: "Producers already on the FCC Covered List, wherever the device is assembled or branded.",
    covers: "Any device category; the test is applied to each logic-bearing component (DSPs, controllers, ASICs, BMCs).",
    where: "New FCC equipment authorizations, which are needed to import or market a new model in the US.",
    exceptions: "Models authorized before 13 October 2026 keep their authorization unless significantly modified.",
    matters: "A Western-branded switch or server is exposed if one controller inside it comes from a covered producer. Supplier-tier tracing, not brand, determines exposure.",
  },
  "R1-FW": {
    what: "Proposed extension of R1 to software and firmware supplied by Covered List entities.",
    targets: "Covered List entities as software or firmware suppliers.",
    covers: "Firmware and software in any device, including devices already deployed.",
    where: "New authorizations and, potentially, updates to the installed base.",
    exceptions: "Not yet defined; the proposal is open for comment.",
    matters: "Unlike R1, this would reach hardware already in service through its update path, turning an authorization risk into an operational one.",
  },
  R2: {
    what: "Reported plan to deny new FCC authorizations to optical transceiver models from Chinese producers at 3.2T and above.",
    targets: "Chinese producers of optical modules. The scenario defaults to ownership; the Broadened case also counts production location.",
    covers: "New transceiver models at 3.2T, phasing in through 2028–29; 800G and 1.6T are untouched in the base case.",
    where: "New FCC equipment authorizations.",
    exceptions: "Reportedly exempt if at least 65% of BOM value is US-sourced. A straddling uncertainty range yields Monitor, not Clear.",
    matters: "This is the scenario's central risk and its weakest evidence: one press report, with no FCC text. It falls on the 2028–29 deployment phases that adopt 3.2T.",
  },
  "R2-LIST": {
    what: "Rumored addition of the four largest Chinese optical-module makers to the Covered List.",
    targets: "InnoLight, Eoptolink, Dongshan Precision and TFC, plus subsidiaries and affiliates.",
    covers: "Their modules as finished devices, and, through R1, any device containing their optical engines.",
    where: "New FCC equipment authorizations.",
    exceptions: "Existing authorizations.",
    matters: "Would turn a generation-specific rule into a supplier-wide one, and would reach co-packaged switches through the component rule.",
  },
  R3: {
    what: "Bill that would bar federal national security systems from using optics made by InnoLight or Eoptolink.",
    targets: "InnoLight, Eoptolink, their subsidiaries and affiliates, and entities later designated by War or Commerce.",
    covers: "Optical transceivers and equipment containing them.",
    where: "Procurement and use in federal national security systems.",
    exceptions: "Waiver authority is expected but unconfirmed, so the model doesn't assume one.",
    matters: "Takes full effect only after a five-year transition, but it argues for a separately sourced optics pool in any hall serving federal customers.",
  },
  R4: {
    what: "InnoLight's listing as a Chinese military company bars DoD from contracting with it and, a year later, from buying its goods.",
    targets: "InnoLight and listed subsidiaries; the model also follows affiliates.",
    covers: "Any product in which the listed entity appears in the supply path.",
    where: "DoD direct contracting (from 30 June 2026) and DoD procurement of goods (from 30 June 2027).",
    exceptions: "None modeled.",
    matters: "Already in force. Any hall serving DoD customers that sources from an InnoLight-path supplier is exposed today.",
  },
  R5: {
    what: "Foreign-produced consumer-grade routers can't obtain new FCC authorization.",
    targets: "Routers produced outside the United States.",
    covers: "Consumer-grade routers. Enterprise and data-center routing equipment is likely out of scope.",
    where: "New FCC equipment authorizations.",
    exceptions: "DoW/DHS Conditional Approval for up to 18 months; the model warns six months before expiry.",
    matters: "A small line item for branch and remote-site kits, but expiring approvals become calendar risk for re-ordering.",
  },
  R6: {
    what: "Foreign-produced connected power inverters can't obtain new FCC authorization.",
    targets: "Connected inverters produced outside the United States.",
    covers: "Network-connected power conversion, as used in on-site battery storage and solar.",
    where: "New FCC equipment authorizations.",
    exceptions: "Domestic end products (US-made with at least 65% US content, rising to 75% in 2029), and Conditional Approvals.",
    matters: "Already in force. On-site storage designs relying on new foreign inverter models need a domestic alternative.",
  },
  RA1: {
    what: "A license is needed to supply significant computing volume to tenants whose ultimate parent is headquartered in a country of concern.",
    targets: "Tenants whose ultimate parent is headquartered in China, Russia, Iran or another listed country.",
    covers: "IaaS compute provided from overseas data centers using advanced US chips.",
    where: "Remote access to compute, above a significant-volume threshold.",
    exceptions: "Usage below the threshold. Because the threshold is still a placeholder, below-threshold tenants show Monitor, not Clear.",
    matters: "Makes tenant KYC a design requirement: operators need ultimate-parent data and per-tenant usage metering.",
  },
  RA2: {
    what: "A license is needed to export advanced chips to companies headquartered in five elevated-diversion-risk countries.",
    targets: "Companies headquartered in Indonesia, Malaysia, Singapore, Thailand or Brazil.",
    covers: "Advanced AI chips and the servers built on them.",
    where: "Export licensing.",
    exceptions: "A validated end-user authorization, if granted.",
    matters: "Siting and operator domicile now drive chip procurement timelines across Southeast Asia.",
  },
  RA3: {
    what: "Existing chip licensing applies worldwide to China-headquartered firms and their subsidiaries.",
    targets: "Firms headquartered in China and their subsidiaries, wherever incorporated.",
    covers: "Advanced AI chips.",
    where: "Export licensing.",
    exceptions: "None modeled.",
    matters: "Closes the offshore-subsidiary route; the operator's ultimate parent matters, not its local registration.",
  },
  RA4: {
    what: "License applications must name IaaS remote end users whose parent is headquartered in a listed country.",
    targets: "Applicants for advanced-chip export licenses.",
    covers: "The content of the application, including the consignee's KYC procedures.",
    where: "Export license applications.",
    exceptions: "Not applicable; this rule changes what must be disclosed, not whether a license is needed.",
    matters: "Tenant identities become part of the licensing record, so tenant screening must happen before procurement.",
  },
  RA5: {
    what: "Case assumption: Megaspeed and its affiliates are added to the Entity List.",
    targets: "Megaspeed International and every entity linked to it by ownership or affiliation.",
    covers: "All items subject to US export controls.",
    where: "Any transaction involving a listed party.",
    exceptions: "None.",
    matters: "Any line whose supply path, or any tenant whose ownership chain, passes through a Megaspeed-linked node is blocked.",
  },
  RA6: {
    what: "Commerce can impose a license requirement on a named item or party by direct notice, which may be oral.",
    targets: "Whatever item or party the notice names.",
    covers: "Any item subject to US export controls.",
    where: "From the date of the notice.",
    exceptions: "None.",
    matters: "Unschedulable risk. It is modeled as a discrete event on the timeline rather than a dated rule.",
  },
};

export interface ProductExplained { what: string; role: string; inside: string; regulators: string }

export const PRODUCT_EXPLAINED: Partial<Record<ProductCategory, ProductExplained>> = {
  OPTICAL_TRANSCEIVER: {
    what: "Electro-optical modules that convert electrical signals to light and back, so data can travel between switches and servers over fiber. Named by aggregate speed: 800G, 1.6T and 3.2T, with each generation roughly doubling bandwidth per port.",
    role: "An AI cluster needs several transceivers per accelerator; a single hall can consume tens of thousands. They are the most numerous network component and among the most supply-constrained.",
    inside: "A digital signal processor (DSP, logic-bearing), lasers (EML or CW sources), a driver/TIA chip (logic-bearing) and the optical sub-assembly. The DSP is typically about a third of the bill of materials.",
    regulators: "Chinese makers hold roughly 60% of datacom transceiver revenue. That concentration is what the reported FCC draft, S.5548 and the 1260H listing of InnoLight are aimed at.",
  },
  SWITCH: {
    what: "Network switches connect servers into a fabric. Leaf (top-of-rack) switches connect servers; spine switches connect leaves. Co-packaged-optics (CPO) switches move the optical engines into the switch package itself.",
    role: "Switch generation determines which transceivers a hall can use, and CPO changes optics from a replaceable plug-in into a permanent part of the switch.",
    inside: "A switching ASIC (logic-bearing), a baseboard management controller (logic-bearing), power and cooling, assembled by a contract manufacturer.",
    regulators: "Under FCC 26-50 the producer of each logic-bearing component, not the brand, decides Covered List exposure. With CPO, optics exposure becomes switch exposure.",
  },
  SERVER: {
    what: "Accelerated compute nodes, typically eight GPUs on an HGX baseboard with CPUs, memory and networking.",
    role: "The reason the data center exists, and by far its largest capital cost.",
    inside: "GPUs (logic-bearing), a BMC (logic-bearing), CPUs and memory, assembled by an original design manufacturer in Taiwan.",
    regulators: "Advanced GPUs are export-controlled. The BIS remote-access rule ties licensing to the operator's headquarters and to who uses the compute.",
  },
  ROUTER_CONSUMER: {
    what: "Small consumer-grade routers used in branch offices, remote sites and out-of-band management kits.",
    role: "A small cost line, but deployed widely and reordered often.",
    inside: "A system-on-chip (logic-bearing), radios and firmware, mostly produced in Vietnam and China.",
    regulators: "Covered List entry DA 26-278 bars new authorizations for foreign-produced consumer routers unless a time-limited Conditional Approval is in force.",
  },
  POWER_INVERTER_CONNECTED: {
    what: "Network-connected power conversion systems that link on-site batteries or solar to the facility's electrical system.",
    role: "Increasingly common as data centers add on-site storage for resilience and grid services.",
    inside: "Power electronics plus a network-connected controller (logic-bearing) that can be managed remotely.",
    regulators: "Covered List entry DA 26-786 bars new authorizations for foreign-produced connected inverters, with a carve-out for domestic end products.",
  },
};

export const ROLE_PLAIN: Record<string, string> = {
  dsp: "Digital signal processor",
  laser: "Laser source",
  tia_driver: "Driver / TIA",
  asic: "Switch ASIC",
  bmc: "Baseboard management controller",
  gpu: "GPU accelerator",
  substrate: "Substrate",
  pcb: "Printed circuit board",
  firmware: "Firmware",
  other: "Channel / other",
};
