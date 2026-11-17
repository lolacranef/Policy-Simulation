// One-off generator for the ILLUSTRATIVE seed CSVs. Output is committed; this script is not part of the app.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2];
const csv = (header, rows) =>
  [header.join(","), ...rows.map((r) => header.map((h) => {
    const v = r[h] ?? "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(","))].join("\n") + "\n";

// ---------- evidence ----------
const SG = (id) => `https://graph.sayari.com/resource/entity/${id}`;
const evidence = [
  { source_id: "EV-SAYARI-OWN", url: "https://graph.sayari.com", publisher: "Sayari Graph (corporate registry records)", date: "2026-11-16", source_type: "PRIMARY", reliability: "B", credibility: 2,
    note: "Ownership or subsidiary relationship recorded in Sayari from corporate registry and filing sources." },
  { source_id: "EV-SAYARI-INNOLIGHT-SZ", url: SG("-P8SBkbAMqpCWDkh5hV2NQ"), publisher: "Sayari Graph", date: "2026-11-16", source_type: "PRIMARY", reliability: "B", credibility: 2,
    note: "Suzhou InnoLight (苏州旭创科技有限公司) is flagged as owned by a Section 1260H entity." },
  { source_id: "EV-SAYARI-COHERENT-MY", url: SG("tBsHpChL0IJLz8P4EUydtg"), publisher: "Sayari Graph", date: "2026-11-16", source_type: "PRIMARY", reliability: "B", credibility: 2,
    note: "Coherent Malaysia Sdn Bhd (Ipoh) recorded as a subsidiary of Coherent Corp." },
  { source_id: "EV-SAYARI-MEGASPEED-MY", url: SG("URvHx-DKHorck1VqtP1WTg"), publisher: "Sayari Graph", date: "2026-11-16", source_type: "PRIMARY", reliability: "B", credibility: 2,
    note: "Megaspeed International Pte Ltd recorded as shareholder of Megaspeed International Sdn Bhd (Johor)." },
  { source_id: "EV-NAME-INFERRED", url: SG("1KiUMzbIgT40GfIy6iJuAg"), publisher: "Sayari Graph (entity name and address only)", date: "2026-11-16", source_type: "ANALYST_NOTE", reliability: "C", credibility: 3,
    note: "Affiliation inferred from the entity name; no registry ownership record found in Sayari. Students should confirm." },
  { source_id: "EV-REPRESENTATIVE", url: "", publisher: "Analyst assumption (representative supply relationship)", date: "2026-11-16", source_type: "ANALYST_NOTE", reliability: "C", credibility: 4,
    note: "Component supplier is a typical source for this part class, not a traced shipment. Replace with a traced trade record." },
  { source_id: "EV-SEED-TENANT", url: "", publisher: "Illustrative tenant record", date: "2026-11-16", source_type: "ANALYST_NOTE", reliability: "C", credibility: 3,
    note: "Tenants are hypothetical; real firms are not named as customers of a hypothetical data center." },
  { source_id: "EV-SEED-WEAK", url: "", publisher: "Illustrative record", date: "2026-11-16", source_type: "ANALYST_NOTE", reliability: "D", credibility: 4,
    note: "Illustrative placeholder for a weak, unconfirmed link." },
];

// ---------- entities ----------
const E = (node_id, name, inc, prod, owner, extra = {}) => ({
  node_id, name, sayari_entity_id: "", country_of_incorporation: inc, production_country: prod, owner_chain_summary: owner,
  list_flags: "", list_flag_dates: "", ...extra,
});
const R = (node_id, name, sid, inc, prod, owner, extra = {}) => ({ ...E(node_id, name, inc, prod, owner, extra), sayari_entity_id: sid });
const entities = [
  // Rule targets and parents (Sayari-resolved).
  R("ENT-INNOLIGHT", "Zhongji InnoLight Co., Ltd.", "cLPARqxARGvH661MwYdb5Q", "CHN", "CHN", "Listed company (Shenzhen); Section 1260H entity", { list_flags: "1260h", list_flag_dates: "2026-06-08" }),
  R("ENT-EOPTOLINK", "Eoptolink Technology Inc., Ltd.", "rVu5uk9-5QzBw7GK5l2MSQ", "CHN", "CHN", "Listed company (Chengdu)"),
  E("ENT-DONGSHAN", "Suzhou Dongshan Precision Manufacturing Co., Ltd.", "CHN", "CHN", "Listed company (Suzhou)"),
  E("ENT-TFC", "Suzhou TFC Optical Communication Co., Ltd.", "CHN", "CHN", "Listed company (Suzhou)"),
  R("ENT-MEGASPEED", "MEGASPEED INTERNATIONAL PTE LTD", "FN6-5HO_izVKgXRmQfy1jg", "SGP", "SGP", "100% SWIFTDATA PTE. LTD. (SGP); formerly 7ROAD INTERNATIONAL HK LIMITED"),
  R("ENT-COHERENT", "Coherent Corp.", "dfAqo3X5apN6zk2QQIGn4g", "USA", "USA", "Listed company (Saxonburg, PA); InP laser fab in Sherman, TX"),
  // Transceiver makers (finished-device producers).
  R("SUP-A-ASM", "Suzhou InnoLight Technology Co., Ltd. (苏州旭创科技有限公司)", "-P8SBkbAMqpCWDkh5hV2NQ", "CHN", "CHN", "Subsidiary of Zhongji InnoLight (Sayari: owned by Section 1260H entity)"),
  R("SUP-B-ASM", "Eoptolink Technology (Thailand) Co., Ltd.", "1KiUMzbIgT40GfIy6iJuAg", "THA", "THA", "Rayong plant; affiliation with Eoptolink inferred from name (no registry record in Sayari)"),
  R("SUP-C-ASM", "Applied Optoelectronics, Inc.", "AAuB6AmaQI1s07XUsaRzFw", "USA", "USA", "Listed company (Sugar Land, TX)"),
  R("SUP-D-ASM", "Coherent Malaysia Sdn. Bhd.", "tBsHpChL0IJLz8P4EUydtg", "MYS", "MYS", "Subsidiary of Coherent Corp. (Ipoh, Perak)"),
  // Components.
  R("CMP-DSP-TW", "Marvell Technology, Inc. (DSP fabricated in Taiwan)", "SmTxRDNTF4O6e0vyP6XIVg", "USA", "TWN", "Listed company (USA); fabless, foundry in Taiwan"),
  R("CMP-LASER-CN", "Shaanxi Yuanjie Semiconductor Technology Co., Ltd. (源杰科技)", "Am-l6gBRp707IaUA8JgATQ", "CHN", "CHN", "Listed company (Xi'an)"),
  R("CMP-LASER-JP", "Mitsubishi Electric Corporation", "etjoP78wytDEDFcgnC57Eg", "JPN", "JPN", "Listed company (Tokyo)"),
  R("CMP-TIA-CN", "Xiamen UX High-Speed IC Co., Ltd. (厦门优迅芯片)", "TSGX884cypF1MgGgeFwJEA", "CHN", "CHN", "Xiamen"),
  R("CMP-TIA-US", "Semtech Corporation", "HR_G9mAB0RsMv1TsgNtmug", "USA", "USA", "Listed company (Camarillo, CA)"),
  R("US-SRC-DSP", "Marvell Technology, Inc. (assumed US-fabricated DSP)", "SmTxRDNTF4O6e0vyP6XIVg", "USA", "USA", "Lever assumption: DSP fabricated in the United States"),
  R("CMP-SW-ODM-TW", "Celestica Inc.", "bKk8RqMYaUtSDKErcu5-zg", "CAN", "THA", "Listed company (Toronto); network hardware built in Thailand"),
  R("CMP-ASIC-US", "Broadcom Inc. (switch ASIC, fabricated in Taiwan)", "VKHlqJ8H-WXSCwpL9_QBPg", "USA", "TWN", "Listed company (Palo Alto, CA); fabless"),
  R("CMP-BMC-TW", "ASPEED Technology Inc.", "TChgSWgw1a_u13OjYiSH5g", "TWN", "TWN", "Listed company (Hsinchu); dominant server BMC supplier"),
  R("CMP-SRV-ODM-TW", "Giga Computing Technology Co., Ltd.", "uS70FSscYjnSmIHjz_I0rA", "TWN", "TWN", "GIGABYTE's server subsidiary (New Taipei)"),
  R("CMP-GPU-US", "NVIDIA Corporation (GPU, fabricated in Taiwan)", "3XdagCdYmWpdouFzXY7ZTg", "USA", "TWN", "Listed company (Santa Clara, CA); fabless"),
  R("SEA-BROKER", "Megaspeed International Sdn. Bhd.", "URvHx-DKHorck1VqtP1WTg", "MYS", "MYS", "Subsidiary of Megaspeed International Pte Ltd (Sayari: shareholder relationship)"),
  R("INV-CN-MFR", "Sungrow Power Supply Co., Ltd.", "hveOkqiTZQuGF4w2H0TRRw", "CHN", "CHN", "Listed company (Hefei)"),
  R("INV-US-MFR", "Dynapower Company LLC", "01n5bmzS7lPpHLyba_B_Mw", "USA", "USA", "South Burlington, VT"),
  R("RTR-MFR-VN", "TP-Link Technologies Vietnam Co., Ltd.", "6ACjzK4mIn0rvLiVvd5zrA", "VNM", "VNM", "Vietnam affiliate of TP-Link Technologies (name-based)"),
  R("RTR-PARENT-CN", "TP-Link Technologies Co., Ltd.", "o-4yYr_x1-0RY2-Bk598vw", "CHN", "CHN", "Shenzhen. Sayari flags usa_section_1260h; listing date not established, so not modeled"),
  E("RTR-US-MFR", "Hypothetical US-produced router maker", "USA", "USA", "Hypothetical: no verified US-produced consumer router was identified"),
  // Hypothetical tenants and their parents.
  E("T1", "US hyperscaler tenant (hypothetical)", "USA", "", "Hypothetical: owned by TP-US-HYPER"),
  E("T2", "Regional AI lab (hypothetical)", "SGP", "", "Hypothetical: SGP holding since 2024; previously CHN parent"),
  E("T3", "Unverified GPU reseller (hypothetical)", "SGP", "", "unresolved"),
  E("T4", "Offshore subsidiary of a Chinese gaming group (hypothetical)", "SGP", "", "Hypothetical: owned by TP-CN-GAMING"),
  E("T5", "Local enterprise (hypothetical)", "IDN", "", "Hypothetical: owned by TP-ID-LOCAL"),
  E("TP-US-HYPER", "US cloud parent (hypothetical)", "USA", "", "Hypothetical"),
  E("TP-SG-HOLD", "Singapore holding company (hypothetical)", "SGP", "", "Hypothetical"),
  E("TP-CN-PRIOR", "Former Chinese parent (hypothetical)", "CHN", "", "Hypothetical"),
  E("TP-CN-GAMING", "Chinese gaming group (hypothetical)", "CHN", "", "Hypothetical"),
  E("TP-ID-LOCAL", "Indonesian conglomerate (hypothetical)", "IDN", "", "Hypothetical"),
  E("T3-PARENT", "Unresolved parent (KYC incomplete)", "", "", "unresolved"),
];

// ---------- parts + edges ----------
const parts = [];
const edges = [];
const edge = (parent, child, relationship, role, lb, share, ev = "EV-SEED", grade = "B2") =>
  edges.push({ parent_node_id: parent, child_node_id: child, relationship, component_role: role, logic_bearing: lb, value_share_est: share ?? "",
    evidence_source_id: ev, evidence_grade: grade });

const suppliers = {
  A: { asm: "SUP-A-ASM", dsp: "CMP-DSP-TW", laser: "CMP-LASER-CN", tia: "CMP-TIA-CN", us: [0.18, 0.12, 0.25], cost: 1.0, lead: 12, brand: "InnoLight", desc: "Chinese-owned / China-produced" },
  B: { asm: "SUP-B-ASM", dsp: "CMP-DSP-TW", laser: "CMP-LASER-CN", tia: "CMP-TIA-CN", us: [0.22, 0.15, 0.3], cost: 1.03, lead: 14, brand: "Eoptolink", desc: "Chinese-owned / Thailand-produced" },
  C: { asm: "SUP-C-ASM", dsp: "US-SRC-DSP", laser: "ENT-COHERENT", tia: "CMP-TIA-US", us: [0.78, 0.7, 0.85], cost: 1.4, lead: 30, brand: "Applied Optoelectronics", desc: "US-owned / US-produced" },
  D: { asm: "SUP-D-ASM", dsp: "CMP-DSP-TW", laser: "CMP-LASER-JP", tia: "CMP-TIA-US", us: [0.48, 0.4, 0.56], cost: 1.15, lead: 18, brand: "Coherent", desc: "US-owned / Malaysia-produced" },
};
const genBase = { 800: 600, 1600: 1100, 3200: 2000 };
for (const [k, s] of Object.entries(suppliers)) {
  for (const g of [800, 1600, 3200]) {
    const id = `XCVR-${k}-${g}`;
    const alts = k === "A" || k === "B" ? `XCVR-D-${g}|XCVR-C-${g}` : k === "D" ? `XCVR-C-${g}` : "";
    parts.push({
      part_id: id, sku: `${g === 3200 ? "3.2T" : g === 1600 ? "1.6T" : "800G"} OSFP module (representative)`, brand: s.brand, category: "OPTICAL_TRANSCEIVER", generation_gbps: g,
      form_factor: "OSFP", fcc_id: g === 800 ? `ILLUSTRATIVE-${k}800` : "", grant_date: g === 800 ? "2025-03-01" : "", is_new_model: g !== 800,
      unit_cost_usd: Math.round(genBase[g] * s.cost), lead_time_weeks: s.lead,
      us_value_est: s.us[0], us_value_low: s.us[1], us_value_high: s.us[2],
      us_value_basis: `Estimate for a ${s.desc} module; DSP ~32%, laser ~20%, driver/TIA ~10% of value`, conditional_approval_expiry: "", conditional_approval_assumed: "", alternates: alts,
    });
    edge(id, s.asm, "assembles", "other", false, null, "EV-REPRESENTATIVE", "C3");
    edge(id, s.dsp, "supplies_component", "dsp", true, 0.32, "EV-REPRESENTATIVE", "C4");
    edge(id, s.laser, "supplies_component", "laser", false, 0.2, "EV-REPRESENTATIVE", "C4");
    edge(id, s.tia, "supplies_component", "tia_driver", true, 0.1, "EV-REPRESENTATIVE", "C4");
  }
}
const P = (o) => parts.push({ fcc_id: "", grant_date: "", conditional_approval_expiry: "", conditional_approval_assumed: "", alternates: "", generation_gbps: "", ...o });
P({ part_id: "SW-TOR-1", sku: "51.2T leaf switch (representative)", brand: "Celestica", category: "SWITCH", form_factor: "1RU", fcc_id: "ILLUSTRATIVE-TOR1",
  grant_date: "2025-06-01", is_new_model: false, unit_cost_usd: 28000, lead_time_weeks: 20, us_value_est: 0.35, us_value_low: 0.28, us_value_high: 0.42,
  us_value_basis: "Estimate: US-designed ASIC, Thailand assembly" });
P({ part_id: "SW-SPINE-1", sku: "102.4T spine switch (representative)", brand: "Celestica", category: "SWITCH", form_factor: "2RU", fcc_id: "ILLUSTRATIVE-SPN1",
  grant_date: "2025-06-01", is_new_model: false, unit_cost_usd: 65000, lead_time_weeks: 24, us_value_est: 0.36, us_value_low: 0.3, us_value_high: 0.44,
  us_value_basis: "Estimate: US-designed ASIC, Thailand assembly" });
P({ part_id: "SW-CPO-3200", sku: "102.4T co-packaged-optics switch (representative)", brand: "Celestica", category: "SWITCH", generation_gbps: 3200, form_factor: "CPO 2RU",
  is_new_model: true, unit_cost_usd: 120000, lead_time_weeks: 40, us_value_est: 0.3, us_value_low: 0.22, us_value_high: 0.38,
  us_value_basis: "Estimate: optical engines are drawn from the wave's optics lines" });
for (const sw of ["SW-TOR-1", "SW-SPINE-1", "SW-CPO-3200"]) {
  edge(sw, "CMP-SW-ODM-TW", "assembles", "other", false, null, "EV-REPRESENTATIVE", "C3");
  edge(sw, "CMP-ASIC-US", "supplies_component", "asic", true, 0.4, "EV-REPRESENTATIVE", "C3");
  edge(sw, "CMP-BMC-TW", "supplies_component", "bmc", true, 0.03, "EV-REPRESENTATIVE", "C3");
}
P({ part_id: "SRV-GPU-1", sku: "8-GPU HGX server (representative)", brand: "GIGABYTE", category: "SERVER", form_factor: "8-GPU 6RU", fcc_id: "ILLUSTRATIVE-GPU1",
  grant_date: "2025-09-01", is_new_model: false, unit_cost_usd: 350000, lead_time_weeks: 26, us_value_est: 0.55, us_value_low: 0.45, us_value_high: 0.62,
  us_value_basis: "Estimate: US-designed GPU and CPU, Taiwan assembly" });
P({ part_id: "SRV-GPU-SEA", sku: "8-GPU HGX server via regional channel (hypothetical route)", brand: "GIGABYTE", category: "SERVER", form_factor: "8-GPU 6RU",
  fcc_id: "ILLUSTRATIVE-GPU1", grant_date: "2025-09-01", is_new_model: false, unit_cost_usd: 362000, lead_time_weeks: 18, us_value_est: 0.55, us_value_low: 0.45,
  us_value_high: 0.62, us_value_basis: "Same server, bought through a Megaspeed subsidiary as a hypothetical sourcing route", alternates: "SRV-GPU-1" });
for (const s of ["SRV-GPU-1", "SRV-GPU-SEA"]) {
  edge(s, "CMP-SRV-ODM-TW", "assembles", "other", false, null, "EV-REPRESENTATIVE", "C3");
  edge(s, "CMP-GPU-US", "supplies_component", "gpu", true, 0.7, "EV-REPRESENTATIVE", "C3");
  edge(s, "CMP-BMC-TW", "supplies_component", "bmc", true, 0.01, "EV-REPRESENTATIVE", "C3");
}
edge("SRV-GPU-SEA", "SEA-BROKER", "supplies_component", "other", false, null, "EV-REPRESENTATIVE", "C4");
P({ part_id: "INV-BESS-1", sku: "250 kW BESS power conversion system (representative)", brand: "Sungrow", category: "POWER_INVERTER_CONNECTED", form_factor: "250 kW PCS",
  is_new_model: true, unit_cost_usd: 90000, lead_time_weeks: 16, us_value_est: 0.05, us_value_low: 0.02, us_value_high: 0.08,
  us_value_basis: "Estimate: China-produced connected inverter", alternates: "INV-BESS-US" });
edge("INV-BESS-1", "INV-CN-MFR", "assembles", "other", false, null, "EV-REPRESENTATIVE", "C3");
P({ part_id: "INV-BESS-US", sku: "250 kW BESS power conversion system (representative)", brand: "Dynapower", category: "POWER_INVERTER_CONNECTED", form_factor: "250 kW PCS",
  is_new_model: true, unit_cost_usd: 125000, lead_time_weeks: 30, us_value_est: 0.7, us_value_low: 0.66, us_value_high: 0.76,
  us_value_basis: "Estimate: US-assembled domestic end product candidate" });
edge("INV-BESS-US", "INV-US-MFR", "assembles", "other", false, null, "EV-REPRESENTATIVE", "C3");
P({ part_id: "RTR-EDGE-1", sku: "Consumer-grade Wi-Fi router (representative)", brand: "TP-Link", category: "ROUTER_CONSUMER", form_factor: "Desktop",
  fcc_id: "ILLUSTRATIVE-RTR1", grant_date: "2026-03-30", is_new_model: true, conditional_approval_expiry: "2027-09-30", conditional_approval_assumed: true,
  unit_cost_usd: 400, lead_time_weeks: 6, us_value_est: 0.02, us_value_low: 0.01, us_value_high: 0.04,
  us_value_basis: "Estimate: Vietnam-produced consumer-grade router for remote sites", alternates: "RTR-EDGE-US" });
edge("RTR-EDGE-1", "RTR-MFR-VN", "assembles", "other", false, null, "EV-REPRESENTATIVE", "C3");
P({ part_id: "RTR-EDGE-US", sku: "Consumer-grade router, US-produced (hypothetical)", brand: "Hypothetical US maker", category: "ROUTER_CONSUMER", form_factor: "Desktop",
  is_new_model: true, unit_cost_usd: 650, lead_time_weeks: 10, us_value_est: 0.7, us_value_low: 0.62, us_value_high: 0.76,
  us_value_basis: "Hypothetical US-produced alternative" });
edge("RTR-EDGE-US", "RTR-US-MFR", "assembles", "other", false, null, "EV-SEED-WEAK", "D4");

// Ownership and affiliation.
edge("ENT-INNOLIGHT", "SUP-A-ASM", "owns", "other", false, 1.0, "EV-SAYARI-INNOLIGHT-SZ", "B2");
edge("ENT-EOPTOLINK", "SUP-B-ASM", "owns", "other", false, 1.0, "EV-NAME-INFERRED", "C3");
edge("ENT-COHERENT", "SUP-D-ASM", "owns", "other", false, 1.0, "EV-SAYARI-COHERENT-MY", "B2");
edge("ENT-MEGASPEED", "SEA-BROKER", "owns", "other", false, 1.0, "EV-SAYARI-MEGASPEED-MY", "B2");
edge("RTR-PARENT-CN", "RTR-MFR-VN", "owns", "other", false, 1.0, "EV-NAME-INFERRED", "C3");

// ---------- tenants + ownership history ----------
const tenants = [
  { tenant_id: "T1", build_wave_id: "W5", name: "US hyperscaler tenant (hypothetical)", ultimate_parent_id: "TP-US-HYPER", ultimate_parent_hq: "USA", allocated_gpus: 1000, monthly_gpu_hours: 600000, kyc_status: "VERIFIED" },
  { tenant_id: "T2", build_wave_id: "W5", name: "Regional AI lab (hypothetical)", ultimate_parent_id: "TP-SG-HOLD", ultimate_parent_hq: "SGP", allocated_gpus: 800, monthly_gpu_hours: 300000, kyc_status: "VERIFIED" },
  { tenant_id: "T3", build_wave_id: "W5", name: "Unverified GPU reseller (hypothetical)", ultimate_parent_id: "T3-PARENT", ultimate_parent_hq: "SGP", allocated_gpus: 400, monthly_gpu_hours: 200000, kyc_status: "UNVERIFIED" },
  { tenant_id: "T4", build_wave_id: "W6", name: "Offshore subsidiary of a Chinese gaming group (hypothetical)", ultimate_parent_id: "TP-CN-GAMING", ultimate_parent_hq: "CHN", allocated_gpus: 700, monthly_gpu_hours: 450000, kyc_status: "VERIFIED" },
  { tenant_id: "T5", build_wave_id: "W6", name: "Local enterprise (hypothetical)", ultimate_parent_id: "TP-ID-LOCAL", ultimate_parent_hq: "IDN", allocated_gpus: 150, monthly_gpu_hours: 90000, kyc_status: "PARTIAL" },
].map((t) => ({ sayari_entity_id: "", evidence_source_id: "EV-SEED-TENANT", ...t }));
const own = (entity_node_id, parent_node_id, pct, from_date, to_date, ev = "EV-SEED-TENANT") => ({ entity_node_id, parent_node_id, pct, from_date, to_date, evidence_source_id: ev });
const ownership = [
  own("T1", "TP-US-HYPER", 100, "2018-01-01", ""),
  own("T2", "TP-CN-PRIOR", 100, "2019-03-01", "2024-06-30"),
  own("T2", "TP-SG-HOLD", 100, "2024-07-01", ""),
  own("T3", "T3-PARENT", 100, "2025-01-01", "", "EV-SEED-WEAK"),
  own("T4", "TP-CN-GAMING", 100, "2021-01-01", ""),
  own("T5", "TP-ID-LOCAL", 100, "2015-01-01", ""),
];

const H = {
  parts: ["part_id", "sku", "brand", "category", "generation_gbps", "form_factor", "fcc_id", "grant_date", "is_new_model", "unit_cost_usd", "lead_time_weeks",
    "us_value_est", "us_value_low", "us_value_high", "us_value_basis", "conditional_approval_expiry", "conditional_approval_assumed", "alternates"],
  edges: ["parent_node_id", "child_node_id", "relationship", "component_role", "logic_bearing", "value_share_est", "evidence_source_id", "evidence_grade"],
  entities: ["node_id", "name", "sayari_entity_id", "country_of_incorporation", "production_country", "owner_chain_summary", "list_flags", "list_flag_dates"],
  evidence: ["source_id", "url", "publisher", "date", "source_type", "reliability", "credibility", "note"],
  tenants: ["tenant_id", "build_wave_id", "name", "sayari_entity_id", "ultimate_parent_id", "ultimate_parent_hq", "allocated_gpus", "monthly_gpu_hours", "kyc_status", "evidence_source_id"],
  own: ["entity_node_id", "parent_node_id", "pct", "from_date", "to_date", "evidence_source_id"],
};
writeFileSync(join(out, "parts.csv"), csv(H.parts, parts));
writeFileSync(join(out, "supplier_edges.csv"), csv(H.edges, edges));
writeFileSync(join(out, "entities.csv"), csv(H.entities, entities));
writeFileSync(join(out, "evidence.csv"), csv(H.evidence, evidence));
writeFileSync(join(out, "tenants.csv"), csv(H.tenants, tenants));
writeFileSync(join(out, "ownership_history.csv"), csv(H.own, ownership));
console.log(`parts ${parts.length}, edges ${edges.length}, entities ${entities.length}, tenants ${tenants.length}`);
