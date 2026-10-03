# D1 quota headroom

Free-tier caps, what the app spends against them, and the guard that keeps the
numbers honest. Every "measured" figure comes from
`tests/d1-limits.guard.test.ts`, which runs the real query functions through
`instrumentDb()` (`server/db/d1Limits.ts`) over a better-sqlite3 handle shimmed
to the `D1Database` interface.

Run it:

```
npm run test:unit -- tests/d1-limits.guard.test.ts
```

## Caps

| Limit | Free tier | Source |
|---|---|---|
| Rows read per day | 5,000,000 | D1 pricing |
| Rows written per day | 100,000 | D1 pricing |
| Bound parameters per statement | 100 | D1 limits |
| Statement size | 100,000 bytes | D1 limits |
| Duration of one query, and of a whole batch | 30 s | D1 limits |
| Subrequests per Worker invocation | 50 | Workers limits |
| Queries per invocation | 50 (Free) | D1 limits |
| Columns per table | 100 | D1 limits |
| Arguments per SQL function call | 32 | D1 limits |
| Row / string / BLOB size | 2,000,000 bytes | D1 limits |

- <https://developers.cloudflare.com/d1/platform/limits/>
- <https://developers.cloudflare.com/workers/platform/limits/>

## What a page load costs

`DataProvider` fetches `/api/data` and `/api/pricing` once per page load
(`src/context/DataProvider.tsx`, `Promise.all` in a `useEffect` with `[]`
deps), so this is one visitor's full read cost.

| Endpoint | Statements | D1 calls | Params (max) | Rows read | Rows written |
|---|---|---|---|---|---|
| `getPublicData` | 4 | 1 | 0 | 22 | 0 |
| `getPricingData` | 5 | 2 | 7 | 55 | 0 |
| **Total** | **9** | **3** | **7** | **77** | **0** |

Read cost per table, at the seeded fixture size:

| Table | Rows | Read by | Access path |
|---|---|---|---|
| `content` | 9 | `getPublicData` | full scan (no index on `display_order`) |
| `cars` | 5 | `getPublicData` | full scan (no index on `display_order`) |
| `faqs` | 5 | `getPublicData` | full scan (no index on `display_order`) |
| `route_data` | 3 | `getPublicData` | full scan (no index on `display_order`) |
| `locations` | 13 | `getPricingData` | full scan (no index on `display_order`) |
| `vehicle_pricing` | 4 | `getPricingData` | full scan |
| `route_groups` | 7 | `getPricingData` | full scan (no index on `display_order`) |
| `pricing_config` | 1 | `getPricingData` | PK seek, non-covering → 2 |
| `route_pricing` | 28 | `getPricingData` | PK seek per group id, non-covering → 29 |

The two PK seeks cost 2 rows each rather than 1 because the index does not
cover the projected columns, so the engine reads an index entry and then the
table row.

### Headroom

| | Rows | % of 5,000,000 | Break-even |
|---|---|---|---|
| Per page load | 77 | 0.0015% | **64,935 page loads/day** |

| Page loads/day | Rows read | Share of quota |
|---|---|---|
| 1,000 | 77,000 | 1.5% |
| 10,000 | 770,000 | 15.4% |
| 64,935 | 5,000,000 | 100% |

Even a site taking 65k page loads a day stays inside the read cap. The read
quota is not the binding constraint at any plausible traffic.

## What an admin write costs

`reorderEntities` first reads the existing ids in `IN`-chunks of 100, then
issues one `UPDATE` per row in a single `db.batch()`. Largest reorderable table
is `locations` (13 rows).

| Operation | Statements | Rows written | % of 100,000 | Break-even |
|---|---|---|---|---|
| `reorderEntities` on `locations` (13 rows) | 14 (1 batch of 13) | 13 | 0.013% | **7,692 full reorders/day** |
| Reorder all five tables (33 rows) | 5 calls | 33 | 0.033% | **3,030 passes/day** |
| Single-row admin edit (`createCar`, `update*`, `delete*`) | 1–2 | 1–2 | ~0.002% | **50,000–100,000 ops/day** |

Writes are the tighter of the two quotas, but 50,000 single-row edits a day is
far beyond what an admin dashboard does. A full reordering pass of every table
every hour costs 792 rows/day, 0.8% of the write cap.

## Why batching and `IN`-chunking matter

Two documented shapes were measured against the same guard:

| `getPricingData` shape | Statements at 7 groups | Statements at 250 groups | Subrequests at 250 |
|---|---|---|---|
| Current: 4-statement batch + one `IN` query per 100 groups | 5 | 7 | 7 |
| One query per route group (N+1) | 11 | 254 | **254 — over the 50 cap** |

Cloudflare does not document whether `db.batch()` bills one subrequest or one
per statement, so the guard reports both and asserts against the pessimistic
one. Current cost is 3 batched / 9 pessimistic against a cap of 50.

The N+1 shape is not hypothetical headroom: at 250 route groups it exceeds the
50-subrequest invocation limit outright. `getPricingData` is written so the
pricing read count grows as `ceil(route_groups / 100)`.

### Where the subrequest cap actually bites

`reorderEntities` issues `1 + n` statements for a table of `n` rows, so a
single reorder of 50 rows needs 51 subrequests under the pessimistic model and
breaches the cap:

| Rows reordered | Statements | Within the 50 cap |
|---|---|---|
| 13 (shipped `locations`) | 14 | yes |
| 49 | 50 | yes, exactly |
| 50 | 51 | **no** |

Every reorderable table is currently far below that (max 13 rows), and the
`IN`-chunking in `reorderEntities` is written against the 100-parameter limit,
not the subrequest limit. If a reorderable table ever passes ~49 rows, the
`UPDATE` statements need chunking the same way the existence check already is.

## The guard

`tests/d1-limits.guard.test.ts` pins all of the above so a change to query
shape cannot quietly spend more quota:

- `getPublicData` costs exactly 4 statements in 1 batch, and that count is
  independent of how many rows exist.
- `getPricingData` costs `4 + ceil(route_groups / 100)` statements and
  `2 + ceil(route_groups / 100)` D1 calls.
- The N+1 shape is detected, not just discouraged: a synthetic per-group
  version fails the budget check at 250 groups.
- No statement exceeds 100 bound parameters; a synthetic 101-parameter
  statement is rejected by `budget()`.
- `reorderEntities` chunk-checks existence at 100 params, batches its updates,
  rejects a duplicate or unknown id before writing, and the test records the
  exact row count at which the pessimistic subrequest model breaks.
- The headroom test prints the measured figures so a regression shows up as a
  changed number in CI output, not only as a failed assertion.

`d1Limits.ts` is production-safe and costs nothing: `instrumentDb()` returns a
pass-through `D1Database` and is only wrapped in tests, so nothing wires it into
the request path.

### Caveats

- Rows read is rows **scanned**, not rows returned. A bare `SCAN` reads the
  whole table, so adding rows to `content`, `cars`, `faqs`, `route_data`,
  `locations`, or `route_groups` raises read cost even though the response
  shape is unchanged. At the current sizes this is noise; at 100k rows in
  `content` it would not be.
- How D1 charges the index entry of a non-covering seek is undocumented. The
  guard charges the conservative `+1`, a 2-row uncertainty on a 5,000,000-row
  quota.
- Whether `db.batch()` bills 1 subrequest or N is undocumented; the guard
  asserts the pessimistic N.
- Figures are measured against the seeded fixture in
  `server/db/seed/seed-001.sql`, not against production row counts. Re-run the
  guard after a seed change or a real backfill to refresh them.
