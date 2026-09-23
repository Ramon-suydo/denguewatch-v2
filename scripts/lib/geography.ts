// Current 10-digit identifiers, checked against PSA's official PSGC summary.
// https://psa.gov.ph/classification/psgc/summary (accessed 2026-09-23)
// These identifiers do not imply that historical boundaries have been harmonized.
export const LGUS = [
  ['CALOOCAN CITY', '1380100000'], ['LAS PINAS CITY', '1380200000'],
  ['MAKATI CITY', '1380300000'], ['MALABON CITY', '1380400000'],
  ['MANDALUYONG CITY', '1380500000'], ['MANILA CITY', '1380600000'],
  ['MARIKINA CITY', '1380700000'], ['MUNTINLUPA CITY', '1380800000'],
  ['NAVOTAS CITY', '1380900000'], ['PARANAQUE CITY', '1381000000'],
  ['PASAY CITY', '1381100000'], ['PASIG CITY', '1381200000'],
  ['QUEZON CITY', '1381300000'], ['SAN JUAN CITY', '1381400000'],
  ['TAGUIG CITY', '1381500000'], ['VALENZUELA CITY', '1381600000'],
  ['PATEROS', '1381701000'],
] as const;

export function normalizeLgu(value: string): string {
  const key = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toUpperCase().replace(/\s+/g, ' ').replace(/^CITY OF /, '').replace(/ CITY$/, '');
  const found = LGUS.find(([name]) => name.replace(/ CITY$/, '') === key);
  if (!found) throw new Error(`Unknown NCR LGU: ${value}`);
  return found[0];
}
