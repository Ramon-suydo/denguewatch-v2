import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { parse } from 'csv-parse/sync';
import readWorkbook, { type CellValue } from 'read-excel-file/node';
import { LGUS, normalizeLgu } from './geography.ts';

export const SOURCES = {
  month: 'ncr_dengue_monthly_with_rates.csv',
  week: 'doh-epi-dengue-data-2016-2021.csv',
  day: 'Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx',
} as const;
export type Observation = {
  lgu_name: string; period_start: string; period_type: 'month' | 'week' | 'day';
  cases: number; deaths: number | null; source: string; source_citation: string;
  source_sha256: string; period_date_semantics: string; quality_flags: string[];
  population: number | null; population_year: number | null;
  incidence_per_100k: number | null; weeks_reported: number | null;
};
export type Lgu = { name: string; psgc_code: string; population: number; population_year: number; population_source: string };
export type Dataset = { lgus: Lgu[]; observations: Observation[]; audit: ReturnType<typeof auditRows> };
const DAY = 86400000;

export function integer(value: unknown, label: string): number {
  if ((typeof value !== 'string' && typeof value !== 'number') || !/^\d+$/.test(String(value).trim()))
    throw new Error(`Invalid nonnegative integer for ${label}`);
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n > 2147483647) throw new Error(`Integer out of range for ${label}`);
  return n;
}
export function isoDate(year: number, month: number, day: number): string {
  const value = new Date(Date.UTC(year, month - 1, day));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day)
    throw new Error(`Invalid calendar date: ${year}-${month}-${day}`);
  return value.toISOString().slice(0, 10);
}
export function sourceDate(value: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!m) throw new Error(`Invalid source date: ${value}`);
  return isoDate(Number(m[3]), Number(m[1]), Number(m[2]));
}
function excelDate(value: CellValue): string {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) throw new Error('Invalid workbook date');
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number' && Number.isInteger(value) && value > 40000 && value < 50000)
    return new Date(Date.UTC(1899, 11, 30) + value * DAY).toISOString().slice(0, 10);
  if (typeof value === 'string') return sourceDate(value);
  throw new Error('Invalid workbook date cell');
}
function base(type: Observation['period_type'], hash: string): Observation {
  return { lgu_name: '', period_start: '', period_type: type, cases: 0, deaths: null,
    source: SOURCES[type], source_citation: 'TODO: exact DOH/FOI dataset citation',
    source_sha256: hash, period_date_semantics: type === 'week' ? 'source_date_label' : type === 'month' ? 'calendar_month_start' : 'calendar_day',
    quality_flags: [], population: null, population_year: null, incidence_per_100k: null, weeks_reported: null };
}
function csv(buffer: Buffer, expected: string[]): Record<string, string>[] {
  const rows = parse(buffer, { columns: true, bom: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  assert.deepEqual(Object.keys(rows[0] ?? {}), expected, 'Unexpected CSV headers');
  return rows;
}
function gapDates(dates: string[], stepDays: number, start = dates[0], end = dates.at(-1)!): string[] {
  const known = new Set(dates); const gaps: string[] = [];
  for (let t = Date.parse(start); t <= Date.parse(end); t += stepDays * DAY) {
    const date = new Date(t).toISOString().slice(0, 10);
    if (!known.has(date)) gaps.push(date);
  }
  return gaps;
}
export function auditRows(rows: Observation[]) {
  const summaries = Object.entries(SOURCES).map(([type, source]) => {
    const selected = rows.filter(r => r.source === source);
    const dates = selected.map(r => r.period_start).sort();
    return { source, period_type: type, rows: selected.length, start: dates[0], end: dates.at(-1),
      lgus: [...new Set(selected.map(r => r.lgu_name))].sort(),
      cases: selected.reduce((sum, r) => sum + r.cases, 0),
      known_deaths: selected.reduce((sum, r) => sum + (r.deaths ?? 0), 0),
      unknown_death_rows: selected.filter(r => r.deaths === null).length,
      deaths_exceed_cases: selected.filter(r => r.deaths !== null && r.deaths > r.cases).length,
      max_cases: Math.max(...selected.map(r => r.cases)), sha256: selected[0]?.source_sha256 };
  });
  const dailyYears = Array.from({ length: 6 }, (_, i) => 2018 + i).map(year => {
    const selected = rows.filter(r => r.period_type === 'day' && r.period_start.startsWith(String(year)));
    const dates = selected.map(r => r.period_start).sort();
    return { year, rows: selected.length, cases: selected.reduce((sum, r) => sum + r.cases, 0),
      start: dates[0], end: dates.at(-1), missing_dates: gapDates(dates, 1, `${year}-01-01`, `${year}-12-31`) };
  });
  const weeklyGaps = LGUS.map(([name]) => ({ lgu: name, missing_dates: gapDates(rows.filter(r => r.period_type === 'week' && r.lgu_name === name).map(r => r.period_start).sort(), 7) }));
  const suspectRows = rows.filter(r => r.deaths !== null && r.deaths > r.cases)
    .map(r => ({ lgu: r.lgu_name, date: r.period_start, source: r.source, cases: r.cases, deaths: r.deaths }));
  return { summaries, dailyYears, weeklyGaps, suspectRows };
}

export async function loadDataset(rawDir: string): Promise<Dataset> {
  const buffers = await Promise.all(Object.values(SOURCES).map(name => readFile(join(rawDir, name))));
  const hashes = buffers.map(buffer => createHash('sha256').update(buffer).digest('hex'));
  const monthly = csv(buffers[0], ['city','year','month','cases','deaths','weeks_reported','population_2020','incidence_per_100k']);
  const weeklyAll = csv(buffers[1], ['loc','cases','deaths','date','Region']);
  assert.equal(weeklyAll[0].loc, '#adm2+name', 'Expected one HXL metadata row');
  assert.equal(weeklyAll.length - 1, 32701, 'Nationwide source changed; re-audit before ingestion');
  const weekly = weeklyAll.slice(1).filter(r => r.Region === 'NATIONAL CAPITAL REGION');
  assert.deepEqual([...new Set(monthly.map(r => r.city))].sort(), [...new Set(weekly.map(r => r.loc))].sort(), 'CSV city spellings differ');
  const populations = new Map<string, number>();
  const observations: Observation[] = monthly.map(r => {
    const name = normalizeLgu(r.city); const population = integer(r.population_2020, 'population');
    assert.ok(population > 0);
    if (populations.has(name)) assert.equal(populations.get(name), population, `Inconsistent population for ${name}`);
    populations.set(name, population);
    const cases = integer(r.cases, 'cases'); const rate = Number(r.incidence_per_100k);
    assert.ok(r.incidence_per_100k !== '' && Number.isFinite(rate) && Math.abs(rate - cases / population * 100000) <= 0.00501, 'Incidence does not match provided 2020 denominator');
    return { ...base('month', hashes[0]), lgu_name: name,
      period_start: isoDate(integer(r.year,'year'), integer(r.month,'month'),1),
      cases, deaths: integer(r.deaths,'deaths'), population, population_year: 2020,
      incidence_per_100k: rate, weeks_reported: integer(r.weeks_reported,'weeks_reported'),
      quality_flags: ['derived_from_weekly', 'fixed_2020_population_denominator'] };
  });
  observations.push(...weekly.map(r => ({ ...base('week', hashes[1]),
    lgu_name: normalizeLgu(r.loc), period_start: sourceDate(r.date),
    cases: integer(r.cases,'cases'), deaths: r.deaths === '' ? null : integer(r.deaths,'deaths'),
    quality_flags: ['weekly_date_boundary_unconfirmed', ...(r.deaths === '' ? ['deaths_missing'] : [])] })));

  const sheets = await readWorkbook(buffers[2]);
  assert.equal(sheets.length, 1, 'Workbook sheets changed; re-audit');
  const grid = sheets[0].data; const header = grid[0];
  const pairs = header.flatMap((value, column) => value === 'MM/DD/YYYY' && header[column + 1] === 'Cases' ? [column] : []);
  assert.equal(pairs.length, 6, 'Expected all six date/case pairs');
  for (const [index, column] of pairs.entries()) {
    const year = 2018 + index; const series: Observation[] = []; let footer: number | undefined;
    for (const row of grid.slice(1)) {
      const date = row[column]; const count = row[column + 1];
      if (date == null && count == null) continue;
      if (typeof date === 'string' && /^(grand )?total$/i.test(date.trim())) {
        assert.equal(footer, undefined, 'Duplicate workbook footer'); footer = integer(count,'annual total'); continue;
      }
      assert.equal(footer, undefined, 'Unexpected data after year footer');
      assert.ok(date != null && count != null, 'Incomplete date/case pair');
      const period = excelDate(date);
      assert.ok(period.startsWith(`${year}-`), `Date outside expected year ${year}`);
      series.push({ ...base('day', hashes[2]), lgu_name: 'MANILA CITY', period_start: period,
        cases: integer(count,'daily cases'), quality_flags: ['deaths_not_provided', 'missing_dates_not_assumed_zero', ...(year === 2023 ? ['partial_2023_coverage'] : [])] });
    }
    assert.equal(series.reduce((sum,r) => sum + r.cases,0), footer, `Workbook total mismatch for ${year}`);
    observations.push(...series);
  }
  const keys = new Set<string>();
  for (const row of observations) {
    const key = `${row.lgu_name}|${row.period_start}|${row.period_type}|${row.source}`;
    assert.ok(!keys.has(key), `Duplicate source key: ${key}`); keys.add(key);
    if (row.deaths !== null && row.deaths > row.cases) row.quality_flags.push('deaths_exceed_cases');
    if (row.period_type !== 'day' && row.period_start.startsWith('2021-')) row.quality_flags.push('partial_2021_coverage');
  }
  // Verify derivation; never ingest monthly and weekly totals as additive observations.
  for (const month of observations.filter(r => r.period_type === 'month')) {
    const weeks = observations.filter(r => r.period_type === 'week' && r.lgu_name === month.lgu_name && r.period_start.slice(0,7) === month.period_start.slice(0,7));
    assert.equal(month.cases, weeks.reduce((sum,r) => sum + r.cases,0));
    assert.equal(month.deaths, weeks.reduce((sum,r) => sum + (r.deaths ?? 0),0));
    assert.equal(month.weeks_reported, weeks.length);
    if (weeks.some(r => r.deaths === null)) month.quality_flags.push('aggregate_contains_missing_deaths');
    if (weeks.some(r => r.quality_flags.includes('deaths_exceed_cases'))) month.quality_flags.push('aggregate_contains_suspect_weekly_values');
    if (['2016-11','2019-01','2020-11'].includes(month.period_start.slice(0,7))) month.quality_flags.push('missing_week_in_source');
  }
  const audit = auditRows(observations);
  assert.deepEqual(audit.summaries.map(r => r.rows), [1037,4403,1910], 'Source counts changed; re-audit');
  assert.deepEqual(audit.summaries.map(r => r.cases), [116147,116147,14635], 'Source totals changed; re-audit');
  assert.deepEqual(audit.dailyYears.map(r => r.rows), [359,353,196,316,352,334]);
  assert.deepEqual(audit.dailyYears.map(r => r.cases), [3641,3961,697,1214,2669,2453]);
  assert.equal(populations.size, 17);
  const lgus = LGUS.map(([name, psgc_code]) => ({ name, psgc_code, population: populations.get(name)!, population_year: 2020, population_source: SOURCES.month }));
  return { lgus, observations, audit };
}
