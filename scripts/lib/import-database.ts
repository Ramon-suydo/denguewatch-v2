import assert from 'node:assert/strict';
import { type Dataset } from './historical.ts';

export interface Database {
  query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}
const fields = `period_start, period_type, cases, deaths, source,
  period_date_semantics, population, population_year, incidence_per_100k,
  weeks_reported, quality_flags, source_sha256`;
const names = fields.replace(/\s/g, '').split(',');

async function stage(db: Database, dataset: Dataset) {
  await db.query(`create temporary table stage_historical on commit drop as
    select l.id as lgu_id, x.* from jsonb_to_recordset($1::jsonb) as x(
      lgu_name text, period_start date, period_type text, cases integer, deaths integer,
      source text, source_citation text, source_sha256 text, period_date_semantics text,
      population integer, population_year smallint, incidence_per_100k numeric(14,4),
      weeks_reported smallint, quality_flags text[]
    ) join public.lgus l on l.name = x.lgu_name`, [JSON.stringify(dataset.observations)]);
  const result = await db.query('select count(*)::integer as n from stage_historical');
  assert.equal(result.rows[0].n, dataset.observations.length, 'Missing or ambiguous LGU mapping');
}
async function verifyStaged(db: Database, dataset: Dataset) {
  const result = await db.query(`select count(*)::integer as n from stage_historical s
    left join public.historical_surveillance h using (lgu_id, period_start, period_type, source)
    where h.id is null or row(${names.map(n => `h.${n}`).join(',')})
      is distinct from row(${names.map(n => `s.${n}`).join(',')})`);
  assert.equal(result.rows[0].n, 0, 'Database records differ from source values/provenance');
  const summaries = await db.query(`select source, period_type, count(*)::integer as rows,
    min(period_start)::text as start, max(period_start)::text as end,
    sum(cases)::text as cases, count(*) filter (where deaths is null)::integer as unknown_death_rows
    from public.historical_surveillance where source = any($1::text[])
    group by source, period_type order by source`, [dataset.audit.summaries.map(s => s.source)]);
  assert.equal(summaries.rows.length, 3);
  for (const expected of dataset.audit.summaries) {
    const actual = summaries.rows.find(r => r.source === expected.source);
    assert.ok(actual);
    assert.equal(actual.rows, expected.rows, `Unexpected stored count for ${expected.source}`);
    assert.equal(actual.period_type, expected.period_type);
    assert.equal(actual.start, expected.start); assert.equal(actual.end, expected.end);
    assert.equal(Number(actual.cases), expected.cases);
    assert.equal(actual.unknown_death_rows, expected.unknown_death_rows);
  }
  const lgus = await db.query(`select name, psgc_code, population, population_year, population_source
    from public.lgus where name = any($1::text[]) order by name`, [dataset.lgus.map(l => l.name)]);
  assert.deepEqual(lgus.rows, [...dataset.lgus].sort((a,b) => a.name.localeCompare(b.name)), 'LGU metadata mismatch');
  return summaries.rows;
}

export async function importDataset(db: Database, dataset: Dataset, verifyOnly = false) {
  await db.query(verifyOnly ? 'begin isolation level repeatable read' : 'begin');
  try {
    if (!verifyOnly) {
      await db.query('select pg_advisory_xact_lock(23092026)');
      await db.query(`insert into public.lgus(name, psgc_code, population, population_year, population_source)
        select name, psgc_code, population, population_year, population_source
        from jsonb_to_recordset($1::jsonb) as x(name text, psgc_code text, population integer,
          population_year smallint, population_source text)
        on conflict (name) do update set psgc_code = excluded.psgc_code,
          population = excluded.population, population_year = excluded.population_year,
          population_source = excluded.population_source`, [JSON.stringify(dataset.lgus)]);
    }
    await stage(db, dataset);
    if (!verifyOnly) {
      await db.query(`insert into public.historical_surveillance as existing
        (lgu_id, ${fields}, source_citation)
        select lgu_id, ${fields}, source_citation from stage_historical
        on conflict (lgu_id, period_start, period_type, source) do update set
          ${names.filter(n => !['period_start','period_type','source'].includes(n)).map(n => `${n} = excluded.${n}`).join(', ')},
          ingested_at = now()
        where row(${names.map(n => `existing.${n}`).join(',')})
          is distinct from row(${names.map(n => `excluded.${n}`).join(',')})`);
    }
    const verified = await verifyStaged(db, dataset);
    await db.query('commit');
    return verified;
  } catch (error) {
    await db.query('rollback');
    throw error;
  }
}
