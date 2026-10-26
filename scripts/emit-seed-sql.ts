// scripts/emit-seed-sql.ts
// Emits the static site content as idempotent batched SQL for
// `npx wrangler d1 execute <db> --file`. The single source of truth is the
// same six `src/data/*` modules that `server/db/seed.ts` imports, so the two
// seed paths cannot drift: change a data module, re-run `npm run db:seed:sql`,
// and the D1 file follows.
//
// IDEMPOTENCY — mirrors the `SELECT COUNT(*) FROM cars` early return in
// server/db/seed.ts:29. That guard table is written LAST (see ORDER below), so
// at the moment every non-cars statement runs, `cars` still holds its
// pre-seed contents and the guard reads the same value the Node guard read.
// Each cars row carries its own `(SELECT COUNT(*) FROM cars) = <n>` guard
// instead, which reproduces the Node semantics exactly:
//
//   fresh DB      -> counts walk 0,1,2,3,4 and all five rows insert
//   fully seeded  -> count is 5, no index matches, nothing inserts (Node: early return)
//   partly seeded -> count n, only row n inserts, then the count advances; the
//                    seed completes itself, exactly as the abandoned Node
//                    transaction would have
//
// No row is ever deleted or overwritten: the file only ever adds missing rows.
//
// ORDER — the FK parents precede their children (`route_pricing.route_group_id`
// references `route_groups(id)`, and D1 enforces FKs unconditionally), and
// `cars` is last because it is the guard table.
//
// FILE FORMAT — no BEGIN/COMMIT (D1 wraps a file in one implicit transaction and
// rejects explicit ones), one statement per row so a bad literal is
// attributable, every statement terminated by `;`. Applied via
// `wrangler d1 execute --file` only — never from server/db/migrations, whose
// .sql files wrangler tracks in d1_migrations.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { locations, routeGroups, vehiclePricing, pricingConfig } from '../src/data/pricing.js';
import { cars, carCategories, carImages, mockupImages, logoImage } from '../src/data/cars.js';
import { contactInfo, routes, stats, services, features } from '../src/data/content.js';
import { faqs } from '../src/data/faqs.js';
import { routeData } from '../src/data/routeData.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(projectRoot, 'server/db/seed');

/**
 * Statements per file. D1 applies a whole file as one implicit transaction and
 * splits it into batches internally; 100 keeps each batch far below the
 * per-request statement ceiling and leaves room for the data modules to grow.
 */
const CHUNK_SIZE = 100;

// ---------------------------------------------------------------------------
// SQL literals
// ---------------------------------------------------------------------------

/**
 * Single-quoted SQLite string literal. Only `'` is special inside a quoted
 * string (SQLite does not process backslash escapes), so doubling it is
 * sufficient and leaves every other byte — Arabic included — untouched.
 */
function lit(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

/** `JSON.stringify` then quote: the exact bytes `parseJson` will read back. */
function json(value: unknown): string {
  return lit(JSON.stringify(value));
}

/** Integer literal. Rejects anything SQLite would store as a different type. */
function int(value: number): string {
  if (!Number.isInteger(value)) {
    throw new Error(`Expected an integer literal, received ${String(value)}`);
  }
  return String(value);
}

/** Booleans are stored as 0/1 INTEGER, matching `rg.bidirectional ? 1 : 0`. */
function flag(value: boolean): number {
  return value ? 1 : 0;
}

/** Nullable column: absent -> SQL NULL, never the string 'null'. */
function nullable(value: string | undefined): string {
  return value === undefined ? 'NULL' : lit(value);
}

// ---------------------------------------------------------------------------
// Statement assembly
// ---------------------------------------------------------------------------

/** `cars` is empty => the seed has not run (the Node guard, in SQL). */
function unseeded(): string {
  return 'WHERE NOT EXISTS (SELECT 1 FROM cars)';
}

/** `cars` holds exactly `inserted` rows => the `inserted`-th seed row is next. */
function nthCar(inserted: number): string {
  return `WHERE (SELECT COUNT(*) FROM cars) = ${int(inserted)}`;
}

/** One guarded `INSERT ... SELECT` — a VALUES list cannot carry a WHERE clause. */
function insert(
  table: string,
  columns: string,
  values: readonly string[],
  guard: string,
): string {
  return [
    `INSERT INTO ${table} (${columns})`,
    `SELECT ${values.join(', ')}`,
    `${guard};`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Per-table statements, in insertion order
// ---------------------------------------------------------------------------

function locationsStmts(): string[] {
  const columns = 'id, name, nameAr, type, display_order';
  return locations.map((l) =>
    insert(
      'locations',
      columns,
      [lit(l.id), lit(l.name), lit(l.nameAr), lit(l.type), int(l.displayOrder)],
      unseeded(),
    ),
  );
}

function routeGroupsStmts(): string[] {
  const columns =
    'id, type, nameAr, bidirectional, from_locations, to_locations, display_order';
  return routeGroups.map((rg) =>
    insert(
      'route_groups',
      columns,
      [
        lit(rg.id),
        lit(rg.type),
        lit(rg.nameAr),
        int(flag(rg.bidirectional)),
        json(rg.fromLocations),
        json(rg.toLocations),
        int(rg.displayOrder),
      ],
      unseeded(),
    ),
  );
}

function routePricingStmts(): string[] {
  const columns = 'route_group_id, vehicle_category, one_way, round_trip';
  return routeGroups.flatMap((rg) =>
    Object.entries(rg.pricing).map(([category, price]) =>
      insert(
        'route_pricing',
        columns,
        [
          lit(rg.id),
          lit(category),
          int(price.oneWay),
          int(price.roundTrip),
        ],
        unseeded(),
      ),
    ),
  );
}

function vehiclePricingStmts(): string[] {
  const columns = 'category, categoryAr, max_passengers, min_passengers';
  return vehiclePricing.map((v) =>
    insert(
      'vehicle_pricing',
      columns,
      [
        lit(v.category),
        lit(v.categoryAr),
        int(v.maxPassengers),
        int(v.minPassengers),
      ],
      unseeded(),
    ),
  );
}

function pricingConfigStmts(): string[] {
  return [
    insert(
      'pricing_config',
      'key, value',
      [lit('whatsappNumber'), lit(pricingConfig.whatsappNumber)],
      unseeded(),
    ),
  ];
}

function contentStmts(): string[] {
  const rows: ReadonlyArray<readonly [string, unknown]> = [
    ['contactInfo', contactInfo],
    ['routes', routes],
    ['stats', stats],
    ['services', services],
    ['features', features],
    ['logoImage', logoImage],
    ['carImages', carImages],
    ['mockupImages', mockupImages],
    ['carCategories', carCategories],
  ];
  return rows.map(([key, value]) =>
    insert('content', 'key, value', [lit(key), json(value)], unseeded()),
  );
}

function faqsStmts(): string[] {
  const columns = 'id, question, answer, display_order';
  return faqs.map((f, i) =>
    insert(
      'faqs',
      columns,
      [lit(`faq-${i + 1}`), lit(f.question), lit(f.answer), int(i)],
      unseeded(),
    ),
  );
}

function routeDataStmts(): string[] {
  const columns =
    'id, title, description, metaTitle, metaDescription, heroImage, priceStart, ' +
    'distance, duration, features, faqs, display_order, fromLabel, toLabel';
  return Object.entries(routeData).map(([id, rd]) =>
    insert(
      'route_data',
      columns,
      [
        lit(id),
        lit(rd.title),
        lit(rd.description),
        lit(rd.metaTitle),
        lit(rd.metaDescription),
        lit(rd.heroImage),
        lit(rd.priceStart),
        lit(rd.distance),
        lit(rd.duration),
        json(rd.features),
        json(rd.faqs),
        int(rd.displayOrder),
        lit(rd.fromLabel),
        lit(rd.toLabel),
      ],
      unseeded(),
    ),
  );
}

/**
 * `cars` last: it is the guard table, so writing it first would make every
 * other statement's `NOT EXISTS` guard false. `nthCar(i)` replaces `unseeded()`
 * so each row still sees the pre-seed count for its own position.
 */
function carsStmts(): string[] {
  const columns =
    'id, nameAr, category, categoryAr, description, seo_description, images, ' +
    'image_alts, features, display_order';
  return cars.map((c, i) =>
    insert(
      'cars',
      columns,
      [
        lit(c.id),
        lit(c.nameAr),
        lit(c.category),
        lit(c.categoryAr),
        lit(c.description),
        nullable(c.seoDescription),
        json(c.images),
        json(c.imageAlts ?? []),
        json(c.features),
        int(c.displayOrder),
      ],
      nthCar(i),
    ),
  );
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

/**
 * Total statement list in insertion order: FK parents before children, guard
 * table (`cars`) last. Keep this order — it is load-bearing, not cosmetic.
 */
function buildStatements(): string[] {
  return [
    ...locationsStmts(),
    ...routeGroupsStmts(),
    ...routePricingStmts(),
    ...vehiclePricingStmts(),
    ...pricingConfigStmts(),
    ...contentStmts(),
    ...faqsStmts(),
    ...routeDataStmts(),
    ...carsStmts(),
  ];
}

/** `seed-001.sql`, `seed-002.sql`, … — zero-padded so `sort()` is the run order. */
function chunkName(index: number): string {
  return `seed-${String(index).padStart(3, '0')}.sql`;
}

function fileHeader(chunkIndex: number, chunkCount: number, total: number): string {
  return [
    `-- Wasalny seed data — generated by scripts/emit-seed-sql.ts. Do not edit.`,
    `-- Source: src/data/{pricing,cars,content,faqs,routeData}.ts`,
    `-- Chunk ${String(chunkIndex)} of ${String(chunkCount)}`,
    `--`,
    `-- Apply with:`,
    `--   npx wrangler d1 execute wasalny-db --local  --file <this file>`,
    `--   npx wrangler d1 execute wasalny-db --remote --file <this file>`,
    `--`,
    `-- Idempotent: every statement is guarded (see the header of the emitter),`,
    `-- so re-running the whole set is a no-op on a seeded database. Requires the`,
    `-- migrations to be applied first`,
    `--   (npx wrangler d1 migrations apply wasalny-db --local|--remote).`,
    `-- ${total} statements in total.`,
    '',
  ].join('\n');
}

function main(): void {
  const statements = buildStatements();

  const chunks: string[][] = [];
  for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
    chunks.push(statements.slice(i, i + CHUNK_SIZE));
  }

  // Stale chunks from a previous, larger run would be executed again by
  // `db:seed:d1:*` (it globs the directory), so clear them first.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  chunks.forEach((chunk, index) => {
    const name = chunkName(index + 1);
    const body = [fileHeader(index + 1, chunks.length, statements.length), ...chunk, ''].join(
      '\n',
    );
    writeFileSync(resolve(outDir, name), body, 'utf8');
    process.stdout.write(`${name}: ${String(chunk.length)} statements\n`);
  });

  process.stdout.write(
    `Wrote ${String(chunks.length)} file(s), ${String(statements.length)} statements to server/db/seed\n`,
  );
}

main();
