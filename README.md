# Chokepoint

*Find where new rules could choke your data-center supply chain.*

**Live site:** https://lolacranef.github.io/Policy-Simulation/

Inject a piece of regulatory intelligence into a datacenter build plan and see which parts, build waves and customers are exposed, when, how well the evidence supports it, and which levers reduce it. Scenario planning, not legal advice.

The product concept is in `CONCEPT-IDEA.md` and the data model and rules in `SPECIFICATIONS.md`. Everything in `frontend/src/data/seed/` is **ILLUSTRATIVE**.

## Run locally

Requirements: Node.js 20+.

```sh
cd frontend
npm install
npm run dev      # http://127.0.0.1:5174
npm test         # importer, engine and acceptance checks (§7.4, §7B.4), plus the §8 performance budget
```

## Publish to GitHub Pages

GitHub Pages serves the `docs/` folder on `main` (Settings → Pages → Deploy from branch → `main` / `docs`).

```sh
cd frontend
npm run build:pages   # type-checks and builds into ../docs with relative paths, so any repo name works
```

Commit and push `docs/` with the source.

## Layout

| Path | Contents |
|---|---|
| `frontend/src/model/` | Types for §3 and §7B.1, plus `config.ts` (severity and confidence weights, generations, cost model) |
| `frontend/src/import/` | CSV parser and the §5 importer with its validation rules |
| `frontend/src/engine/` | Rule engine (`evaluate.ts`), supplier graph, evidence grading, branch overrides, levers |
| `frontend/src/data/seed/` | Seed CSVs in the student import format, the build waves, and both scenario files |
| `frontend/tests/` | Vitest suites, one test per acceptance check |

## Seed data sources

Manufacturers, component makers and ownership links in `frontend/src/data/seed/` were resolved in Sayari on 16 November 2026, and each carries its Sayari entity ID. Evidence is graded by how the link is supported:

| Grade | Basis | Example |
|---|---|---|
| B2 | Ownership recorded in Sayari registry data | Suzhou InnoLight → Zhongji InnoLight; Coherent Malaysia → Coherent Corp.; Megaspeed International Sdn. Bhd. → Megaspeed International Pte Ltd |
| C3 | Inferred from the entity name, or a typical maker of the product class | Eoptolink Technology (Thailand) → Eoptolink; module and switch manufacturers |
| C4 | Representative component supplier, not a traced shipment | DSP, laser and driver/TIA vendors |

The data center, its deployment phases, quantities, prices, US-content shares and tenants are hypothetical. Tenants are deliberately not real firms. Inclusion in a supply path is not an allegation of wrongdoing.

Sayari flags TP-Link Technologies Co., Ltd. as a Section 1260H entity. The listing date wasn't established, so the flag is noted but not modeled; confirming it would expose the W2 edge routers under the DoD rule.

To regenerate the CSVs after editing the source tables, run `node scripts/gen-seed.mjs src/data/seed` from `frontend/`.

## Student data

Replace the CSVs in `frontend/src/data/seed/` with traced data in the same format (§5, §7B.5). Required: `parts.csv`, `supplier_edges.csv`, `entities.csv`, `evidence.csv`. Optional: `tenants.csv`, `ownership_history.csv`, and `wave_quantities.csv` (`build_wave_id,part_id,qty`), which remaps the build waves to your own part IDs.

Edge direction in `supplier_edges.csv` is parent → child. For `assembles` and `supplies_component`, the child makes or supplies the parent part. For `owns`, the parent owns the child. `affiliate_of` is treated as symmetric. List flags and their dates are pipe-separated and must pair up (`covered_list|1260h`, `2026-01-01|2026-06-08`).

`parts.csv` accepts three optional columns beyond §5: `conditional_approval_expiry`, `conditional_approval_assumed`, and `alternates` (pipe-separated part IDs).

## Spec extensions and interpretations

- **FCC jurisdiction.** FCC equipment rules apply only to waves sited in the US, unless a wave sets `fcc_jurisdiction: true`. An FCC match at a non-US site shows as WATCH with an `OUT_OF_JURISDICTION` flag. This is how §7B.4 check 6 (W6 optics pick up the transceiver scenario) is met without claiming the FCC regulates a site in Indonesia.
- **§7.4 check 1.** "W1 and W2 stay CLEAR" is read as "untouched by the new-authorization rules". W2's Supplier A line is still BLOCKED_DOD under R4, which is check 4.
- **New fields:**
  - `Rule.enabled`: branch-only rules.
  - `Rule.effect: DISCLOSURE`: RA4 adds a flag but doesn't change status.
  - `timing.context_effective_dates`: 1260H contracting vs. goods dates.
  - `target.production_country_not_in`: "foreign-produced".
  - `volume_threshold.confirmed`.
- **BLOCKED_EXPORT.** A new status for Entity List and is-informed blocks.
- **Carve-outs.** The finished-device producer is always tested under the logic-bearing component trigger. Waivers are recorded but never assumed.
