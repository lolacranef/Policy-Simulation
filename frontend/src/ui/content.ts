// Editorial content for the Data center, Why it matters and Case files pages.
// Sayari facts were retrieved on 16 November 2026; they are a dated snapshot, not a live feed.
import type { PartKey } from "./datacenter";

const SG = (id: string) => `https://graph.sayari.com/resource/entity/${id}`;

// ---------------------------------------------------------------- 02 Data center

export interface HallPart { key: PartKey; name: string; what: string; regulated: string; bom: string[]; note?: string }

export const HALL_PARTS: HallPart[] = [
  { key: "gpu", name: "GPU server racks", bom: ["SRV-GPU-1", "SRV-GPU-SEA"],
    what: "Rows of eight-GPU servers that do the training and inference work. They draw most of the power and generate most of the heat.",
    regulated: "Advanced GPUs are export-controlled. The BIS remote-access rule adds licensing tied to the operator's headquarters and to who rents the compute." },
  { key: "tor", name: "Top-of-rack switches", bom: ["SW-TOR-1"],
    what: "A leaf switch on top of each rack connects that rack's servers to the network fabric.",
    regulated: "Under FCC 26-50 the producers of the switch's logic-bearing chips, not its brand, decide whether a new model can be authorized." },
  { key: "optics", name: "Optical transceivers and fiber", bom: ["XCVR-A-800", "XCVR-A-1600", "XCVR-A-3200", "XCVR-B-800", "XCVR-B-1600", "XCVR-B-3200", "XCVR-C-800", "XCVR-C-1600", "XCVR-C-3200", "XCVR-D-800", "XCVR-D-1600", "XCVR-D-3200"],
    what: "Overhead trays carry fiber between racks and spines; a transceiver at each end turns electrical signals into light. A large hall uses tens of thousands.",
    regulated: "The reported FCC draft, S.5548 and InnoLight's Section 1260H listing all aim here, because Chinese makers dominate supply." },
  { key: "spine", name: "Spine switches", bom: ["SW-SPINE-1", "SW-CPO-3200"],
    what: "The core of the fabric: every leaf switch connects to every spine. Co-packaged-optics spines build the optical engines into the switch.",
    regulated: "With co-packaged optics, an optics restriction becomes a switch restriction, because the optical engine can no longer be swapped out." },
  { key: "cooling", name: "Cooling plant", bom: [],
    what: "Air handlers inside the hall and chillers outside remove the heat. Water-cooled designs draw heavily on local supply.",
    regulated: "No rule in this model governs cooling.",
    note: "Host-community water use is outside every rule here, yet in Johor the state has asked operators to defer water-cooled expansion until mid-2027. See 03 Why it matters." },
  { key: "bess", name: "Battery storage and inverters", bom: ["INV-BESS-1", "INV-BESS-US"],
    what: "On-site battery containers and their power conversion systems provide backup and grid services.",
    regulated: "Covered List entry DA 26-786 bars new authorizations for foreign-produced connected inverters unless they qualify as domestic end products." },
  { key: "router", name: "Remote-site router", bom: ["RTR-EDGE-1", "RTR-EDGE-US"],
    what: "Small consumer-grade routers at remote sites and in out-of-band management kits.",
    regulated: "Covered List entry DA 26-278 bars new authorizations for foreign-produced consumer routers unless a time-limited Conditional Approval is in force." },
];

// ---------------------------------------------------------------- 03 Why it matters

export interface HarmItem { t: string; line: string; right: string; gap: string; body: string[]; src: [string, string][] }

export const HARMS: HarmItem[] = [
  { t: "Compute that powers surveillance", line: "US chips ran the supercomputer behind Xinjiang's policing system.",
    right: "Privacy; freedom from arbitrary detention",
    gap: "Export controls follow the chip, not the compute. Remote access from a third-country data center reaches the same end users the controls were written to stop.",
    body: [
      "The New York Times reported in 2020 that Intel and NVIDIA chips powered the Urumqi Cloud Computing Center, which processes surveillance footage and phone data used by security forces in Xinjiang. Both companies said they were unaware of the misuse.",
      "The Congressional-Executive Commission on China asked both chief executives what due diligence they had done before selling to the entities involved. The November 2026 remote-access rule is the latest attempt to close the route by which compute, rather than chips, crosses borders.",
    ],
    src: [["New York Times (Nov 2020)", "https://www.nytimes.com/2020/11/22/technology/china-intel-nvidia-xinjiang.html"], ["CECC letters to Intel and NVIDIA (Dec 2020)", "http://www.cecc.gov/media-center/press-releases/chairs-ask-ceos-of-intel-and-nvidia-about-possible-involvement-in-human"]] },
  { t: "Firms already named for abuses", line: "Surveillance companies were listed in 2019 for their role in repression of Uyghurs.",
    right: "Freedom of religion and movement; non-discrimination",
    gap: "Listings bind the named firm. Affiliates, renamed subsidiaries and offshore plants carry on unless an affiliates rule reaches them, as Case 2 shows.",
    body: [
      "In October 2019 the Commerce Department added 28 Chinese organizations to the Entity List, including Hikvision, Dahua, SenseTime, Megvii and iFlytek. It said their technologies had been used in the surveillance, detention and repression of Uyghurs, Kazakhs and other Muslim minorities.",
      "Hikvision and Dahua equipment was later placed on the FCC Covered List. FCC 26-50 extends that logic to logic-bearing components, but only for new authorizations; equipment already installed is untouched.",
    ],
    src: [["CSIS analysis (Oct 2019)", "https://www.csis.org/analysis/understanding-entities-listing-context-us-china-ai-competition"], ["Davis Wright Tremaine summary", "https://www.dwt.com/insights/2019/10/us-blacklists-eight-chinese-technology-firms"], ["FCC Covered List", "https://www.fcc.gov/supplychain/coveredlist"]] },
  { t: "Forced labor in the electronics base", line: "Uyghur labor transfers reached factories supplying global electronics brands.",
    right: "Freedom from forced labor",
    gap: "None of the rules modeled here screens for forced labor. The UFLPA applies at US import, so hardware shipped straight to a data center abroad never meets it.",
    body: [
      "ASPI identified 27 factories in nine Chinese provinces using Uyghur labor transferred from Xinjiang between 2017 and 2019, at least 80,000 workers in all, including a Foxconn facility in Zhengzhou that assembles consumer electronics.",
      "Sayari flags sub-tier forced-labor risk (Xinjiang-origin and UFLPA product blueprints) on many entities in this dataset, including Suzhou InnoLight, Eoptolink and Speedmatrix. These flags are statistical signals from product and supplier patterns, not findings that forced labor was used.",
    ],
    src: [["ASPI, Uyghurs for Sale (2020)", "https://respect.international/wp-content/uploads/2020/06/Uyghurs-for-sale-%E2%80%98Re-education%E2%80%99-forced-labour-and-surveillance-beyond-Xinjiang-.pdf"], ["Suzhou InnoLight in Sayari", SG("-P8SBkbAMqpCWDkh5hV2NQ")]] },
  { t: "Military end use", line: "Inspur was listed in 2023 for supercomputers built for the military.",
    right: "Right to life and security of person",
    gap: "Military-end-use listings stop sales to the listed group. Sales by its renamed affiliates into third-country hosting sit in the gap the affiliates rule is meant to close.",
    body: [
      "Inspur Group was added to the Entity List on 2 March 2023, and six more subsidiaries in March 2025, for contributing to supercomputers for military end use. Hewlett Packard Enterprise has alleged in court that Inspur renamed US subsidiaries to keep doing business.",
      "Sayari records AIVRES SYSTEMS INC, formerly INSPUR SYSTEMS INC, as owned by an Entity List and Section 1260H entity. It is the largest supplier to a Johor hosting company in this dataset (Case 2).",
    ],
    src: [["Federal Register 2025-05427", "https://www.federalregister.gov/documents/2025/03/28/2025-05427/additions-to-the-entity-list"], ["Reuters via Yahoo Finance (Mar 2025)", "https://finance.yahoo.com/news/us-adds-dozens-entities-export-204143122.html"], ["Aivres Systems in Sayari", SG("AyIzhROGRdxVhVGRWL0WnQ")]] },
  { t: "Communities around the data centers", line: "Johor asked operators to wait for water until mid-2027.",
    right: "Right to water; right to an adequate standard of living",
    gap: "Export and supply-chain rules say nothing about host communities. The site most exposed to these rules, Johor, is also where water stress is sharpest.",
    body: [
      "Johor has become Southeast Asia's largest data center hub. Amid drought and supply disruptions for residents, state officials asked investors to postpone water-cooled expansion for at least 18 months, until new infrastructure is finished in mid-2027.",
      "Residents near new facilities have reported falling water pressure. Rules that push AI compute offshore, through licensing or siting, also move its water and power demand onto communities with less say over it.",
    ],
    src: [["South China Morning Post", "https://www.scmp.com/week-asia/health-environment/article/3333109/data-centres-malaysias-johor-told-wait-water-until-mid-2027"], ["Clearly Tech on Johor water", "https://www.clearlytech.co/p/how-bridge-data-centres-flipped-the"]] },
  { t: "Whose responsibility is it?", line: "Where rules leave gaps, due diligence falls to the buyer.",
    right: "UN Guiding Principles on Business and Human Rights",
    gap: "Every gap on this page is legal under current rules. That is exactly where the UN Guiding Principles expect companies to look for themselves.",
    body: [
      "The UN Guiding Principles, endorsed in 2011, expect companies to identify, prevent and account for human rights impacts linked to their operations and supply chains, whether or not local law requires it.",
      "For a data center operator that means asking who makes each logic-bearing component, who owns the maker, who rents the compute, and what the facility does to its neighbors. Chokepoint's evidence grades show where those answers are still guesses.",
    ],
    src: [["UN Guiding Principles (OHCHR)", "https://www.ohchr.org/sites/default/files/documents/publications/guidingprinciplesbusinesshr_en.pdf"]] },
];

// ---------------------------------------------------------------- 06 Case files

export type Verdict = "caught" | "partly" | "missed";
export interface CaseFile {
  id: string; q: string; title: string; sum: string;
  steps: [string, string, [string, string][]][];
  verdicts: [string, Verdict, string][];
  lesson: string;
}

export const CASES: CaseFile[] = [
  { id: "speedmatrix", q: "Would any rule catch servers from a listed group's US arm?",
    title: "An Entity List group's US subsidiary supplying a Johor hosting company",
    sum: "Speedmatrix, a Johor hosting company registered in 2024, received over 2,000 import lines in 14 months. Its largest supplier is the renamed US subsidiary of Inspur, a group on the Entity List since 2023. Nothing here shows a violation; the case shows where the rules stop.",
    steps: [
      ["2 Mar 2023", "Inspur Group is added to the Entity List for developing supercomputers for military end use. Six more subsidiaries follow in March 2025.", [["Federal Register 2025-05427", "https://www.federalregister.gov/documents/2025/03/28/2025-05427/additions-to-the-entity-list"]]],
      ["2023–2025", "Sayari records AIVRES SYSTEMS INC of Fremont, California under its former name INSPUR SYSTEMS INC, flagged as owned by an Entity List and Section 1260H entity and within the BIS 50 percent (affiliates) rule. HPE has alleged in court that Inspur renamed US subsidiaries.", [["Aivres Systems in Sayari", SG("AyIzhROGRdxVhVGRWL0WnQ")], ["HPE lawsuit coverage", "https://finance.yahoo.com/news/hp-enterprise-sues-chinas-inspur-142144048.html"]]],
      ["7 Feb 2024", "Speedmatrix Sdn Bhd is registered in Malaysia for data processing and hosting, at an address c/o the Huashi Brightray Data Centre in Kulai, Johor. Giga Computing's Malaysian consignee address names the same site.", [["Speedmatrix in Sayari", SG("mT36ZKxU6CJ3k_iSvPbE7g")], ["Giga Computing in Sayari", SG("uS70FSscYjnSmIHjz_I0rA")]]],
      ["Jan 2025 – Feb 2026", "Speedmatrix receives 2,033 import lines: 1,294 from Aivres Systems and 181 from Giga Computing; 802 shipped from the US. The leading product codes are networking equipment (HS 851762, 512 lines), server parts (847330) and processing units (847150).", [["Speedmatrix in Sayari", SG("mT36ZKxU6CJ3k_iSvPbE7g")]]],
    ],
    verdicts: [
      ["Entity List (Inspur Group)", "partly", "A listing restricts exports to the listed parties. A US affiliate selling outward is reached only if it is listed itself or the affiliates rule applies; check that rule's current enforcement status."],
      ["BIS IFR: diversion-risk HQ (RA2)", "caught", "Speedmatrix is headquartered in Malaysia, so advanced chips sold to it need a license from February 2027."],
      ["BIS IFR: remote access (RA1)", "partly", "Depends on who rents the compute and how much. Tenant identities are not in the trade data."],
      ["Section 1260H list (R4)", "missed", "Restricts DoD contracting and procurement only; a commercial Malaysian site is outside it."],
    ],
    lesson: "Entity listings bind the named buyer. Equipment sold onward by a renamed affiliate into third-country hosting is caught only by the affiliates rule and the new remote-access controls, and both depend on ownership data a screen must actually see." },
  { id: "megaspeed-optics", q: "Would any rule stop 800G optics reaching an Indonesian GPU operator?",
    title: "Hong Kong-shipped transceivers for a Megaspeed site",
    sum: "PT Megaspeed International Indonesia imports servers from Giga Computing and 800G transceivers from a Hong Kong trader. The optics rules in this model regulate the US market, so they never reach this site.",
    steps: [
      ["May 2024 – Jun 2026", "PT Megaspeed International Indonesia records 313 import lines. The largest suppliers are Giga Computing (134) and VFO International Group of Hong Kong (90); shipments leave from China (89), Hong Kong (85) and Taiwan (64).", [["PT Megaspeed Indonesia in Sayari", SG("PYinpvTxlr74auP7vyhhYA")], ["VFO International in Sayari", SG("LyYXU2ecOOolgzwBz2qPyw")]]],
      ["Jul 2024 – Jan 2026", "VFO ships 800G OSFP112 DR8 optical transceivers from Hong Kong to Jakarta. Two August 2024 lines name model T-OH8CNT-NBK; the T- prefix matches InnoLight's part-numbering convention, an inference rather than a record (grade C3).", [["VFO International in Sayari", SG("LyYXU2ecOOolgzwBz2qPyw")]]],
      ["11 Jun 2026", "Giga Computing ships Xeon Platinum 8480+ CPUs, server motherboards and PCIe switch cards from Taiwan to the same importer.", [["Giga Computing in Sayari", SG("uS70FSscYjnSmIHjz_I0rA")]]],
    ],
    verdicts: [
      ["Reported transceiver draft (R2)", "missed", "Applies only from 3.2T and only to US equipment authorization; 800G modules in Indonesia are outside both."],
      ["Section 1260H list (R4)", "missed", "DoD procurement only."],
      ["BIS IFR: diversion-risk HQ (RA2)", "partly", "Reaches advanced chips to Indonesia-headquartered firms from February 2027, not the optics."],
      ["Entity List: Megaspeed (RA5, branch)", "partly", "Would reach recorded subsidiaries, but Sayari holds no ownership link to the Indonesian importer (Case 3)."],
    ],
    lesson: "The optics rules protect the US network. Chinese-made optics feeding AI compute abroad sit outside them; only chip and remote-access controls reach this kind of site." },
  { id: "megaspeed-owner", q: "Would the ultimate-parent test catch Megaspeed?",
    title: "A change of owner on paper",
    sum: "Megaspeed was incorporated as 7Road International and was held through Hong Kong by a group traced to Shenzhen. Today a Singapore company owns it. Whether control really moved is the question the headquarters test turns on.",
    steps: [
      ["2015", "Incorporated in Singapore as 7ROAD INTERNATIONAL PTE. LTD. (UEN 201535940Z).", [["Megaspeed in Sayari", SG("FN6-5HO_izVKgXRmQfy1jg")]]],
      ["Former owner", "7ROAD INTERNATIONAL HK LIMITED, which Sayari marks as possibly the same as a Hong Kong 第七大道國際 entity whose ownership runs to Shenzhen 7th Road Technology (深圳第七大道科技有限公司). The date of the change is not in the record.", [["7Road International HK in Sayari", SG("2tnN1g-2O6Y6qClgUtLmCQ")], ["Shenzhen 7th Road in Sayari", SG("7arOLM28bh6crd4YBDugBw")]]],
      ["Current owner", "SWIFTDATA PTE. LTD., held by Tan Yong Pong (Singapore and Malaysia).", [["SwiftData in Sayari", SG("suMpm_3sU-j4OqC5_21HYA")]]],
      ["2024", "Subsidiaries recorded: Megaspeed International Sdn Bhd (Johor), MSFusion Sdn Bhd and Megaspeed Australia. PT Megaspeed International Indonesia trades under the name but has no ownership link in Sayari.", [["Megaspeed International Sdn Bhd", SG("URvHx-DKHorck1VqtP1WTg")], ["MSFusion Sdn Bhd", SG("iIGaqak0QygB_eecCv2FTQ")]]],
      ["Nov 2026", "Press reports, citing the Wall Street Journal, say Megaspeed bought over $4 billion of NVIDIA chips; the company says its business is lawful. Treasury says several agencies have sought an Entity List designation.", [["Axios", "https://www.axios.com/2026/11/16/trump-admin-moves-to-close-china-ai-chip-loophole"]]],
    ],
    verdicts: [
      ["BIS guidance: China-HQ firms (RA3)", "missed", "The current ultimate parent is in Singapore."],
      ["BIS IFR: remote access (RA1)", "partly", "A current-owner test misses the Chinese history; Chokepoint's 36-month look-back flags it only if the change date is confirmed."],
      ["BIS IFR: diversion-risk HQ (RA2)", "caught", "Singapore headquarters: advanced chips need a license from February 2027."],
      ["Entity List: Megaspeed (RA5, branch)", "partly", "Would reach the recorded subsidiaries, but not the Indonesian importer that registry data does not tie to the group."],
    ],
    lesson: "A headquarters test is only as good as the ownership history behind it. A transfer to a local holding company defeats a current-owner check unless the look-back and the control question are built in." },
  { id: "innolight-thailand", q: "Does moving production to Thailand escape the optics rules?",
    title: "InnoLight's Thai plant",
    sum: "InnoLight, the world's largest optical-module maker, was listed under Section 1260H in June 2026. Sayari ties both its Suzhou and Thai manufacturing companies to the listed parent. Which rules follow the product offshore depends on how 'Chinese' is defined.",
    steps: [
      ["8 Jun 2026", "Zhongji InnoLight is added to the Section 1260H list. DoD contracting is barred from 30 June 2026 and goods procurement from 30 June 2027.", [["WilmerHale alert", "https://www.wilmerhale.com/en/insights/client-alerts/20260611-pentagon-adds-65-new-entities-to-the-1260h-list-of-chinese-military-companies"], ["Zhongji InnoLight in Sayari", SG("cLPARqxARGvH661MwYdb5Q")]]],
      ["Sayari ownership", "Suzhou InnoLight (苏州旭创科技有限公司) and InnoLight Technology Thailand (旭创科技泰国公司) are both flagged as owned by a Section 1260H entity.", [["Suzhou InnoLight", SG("-P8SBkbAMqpCWDkh5hV2NQ")], ["InnoLight Thailand", SG("zwKGCFjQXMRs6zGXoxzNDQ")]]],
      ["Jul 2026", "FCC 26-50 notes the major Chinese optical-module makers are not on the Covered List.", [["FCC 26-50", "https://docs.fcc.gov/public/attachments/FCC-26-50A1.pdf"]]],
    ],
    verdicts: [
      ["Reported transceiver draft (R2), by producer", "caught", "At 3.2T, ownership makes Thai-made modules Chinese-produced."],
      ["Reported transceiver draft (R2), by location", "missed", "Production in Thailand falls outside a production-location test."],
      ["Section 1260H list (R4)", "caught", "The listing reaches subsidiaries for DoD procurement."],
      ["S.5548 (R3)", "caught", "Covers subsidiaries and affiliates, after a five-year transition and only if enacted."],
      ["FCC 26-50 component rule (R1)", "missed", "InnoLight is not on the Covered List."],
    ],
    lesson: "Relocation defeats location-based rules and not ownership-based ones. The definition the FCC chooses for 'Chinese' is the single biggest variable in this scenario." },
  { id: "eoptolink-thailand", q: "Can a screen see who owns Eoptolink's Thai plant?",
    title: "A plant with no owner on file",
    sum: "Eoptolink is named in S.5548 and rumored for the Covered List. Its Thai plant appears in trade records being equipped, but Sayari holds no registry record of who owns it.",
    steps: [
      ["Parent", "Eoptolink Technology Inc., Ltd., Chengdu (unified social credit code 91510100674300237M).", [["Eoptolink in Sayari", SG("rVu5uk9-5QzBw7GK5l2MSQ")]]],
      ["Mar 2023 – Oct 2026", "26 trade lines involve Eoptolink Technology (Thailand), most of them inbound: semiconductor manufacturing equipment (HS 848640) shipped from Japan and Malaysia, plus some optical communications equipment. The pattern is consistent with a plant being fitted out.", [["Eoptolink Thailand in Sayari", SG("1KiUMzbIgT40GfIy6iJuAg")]]],
      ["Registry", "No shareholder record links the Thai company to the Chengdu parent in Sayari. The affiliation rests on the name alone (grade C3).", [["Eoptolink Thailand in Sayari", SG("1KiUMzbIgT40GfIy6iJuAg")]]],
    ],
    verdicts: [
      ["S.5548 (R3)", "partly", "Reaches affiliates, but proving the affiliation needs evidence a registry-based screen does not have."],
      ["Reported transceiver draft (R2), by producer", "partly", "Caught only if the producer test can see ownership; here it rests on a name."],
      ["Optics makers on Covered List (R2-LIST, rumored)", "partly", "Would extend to affiliates, with the same evidence problem."],
    ],
    lesson: "A data void is a finding. Rules that reach 'affiliates' are only as strong as the ownership records available in the producing country." },
  { id: "tp-link", q: "Would the router rules catch a 1260H-flagged maker's Vietnam output?",
    title: "Consumer routers from Vietnam",
    sum: "Remote-site routers are a small line item, but the category rule catches them regardless of owner, while the ownership-based rule depends on a listing date we could not establish.",
    steps: [
      ["23 Mar 2026", "FCC Public Notice DA 26-278 places foreign-produced consumer-grade routers on the Covered List, with Conditional Approvals of up to 18 months.", [["Baker McKenzie summary", "https://www.bakermckenzie.com/en/insight/publications/2026/04/united-states-fcc-adds-foreign-made-routers-to-covered-list"]]],
      ["Sayari flags", "TP-LINK Technologies Co., Ltd. (Shenzhen) carries a Section 1260H flag in Sayari; the listing date was not established in this pass.", [["TP-Link Technologies in Sayari", SG("o-4yYr_x1-0RY2-Bk598vw")]]],
      ["Vietnam", "TP-Link Technologies Vietnam (enterprise code 0310685120) is the Vietnam affiliate by name; registry ownership was not confirmed.", [["TP-Link Vietnam in Sayari", SG("6ACjzK4mIn0rvLiVvd5zrA")]]],
    ],
    verdicts: [
      ["DA 26-278 foreign routers (R5)", "caught", "Category-wide and location-based: any foreign-produced consumer router needs Conditional Approval for a new authorization."],
      ["Section 1260H list (R4)", "partly", "Would bar DoD procurement once the listing and its date are confirmed; not modeled until then."],
      ["FCC 26-50 component rule (R1)", "missed", "TP-Link is not on the Covered List as an entity."],
    ],
    lesson: "Category-wide rules catch by production location, so ownership tracing matters less here than for optics; the risk becomes a calendar of expiring approvals." },
];
