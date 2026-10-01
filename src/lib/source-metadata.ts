export const PENDING = "[pending]";
export const CITATION_PENDING = "[exact citation pending]";
export const citationFields = {
  title: "Title",
  issuingOffice: "Issuing office",
  dateObtained: "Date obtained",
  foiRequestId: "FOI request ID",
  url: "URL",
  usageTerms: "Usage terms",
} as const;
export interface SourceMetadata {
  title: string;
  issuingOffice: string;
  dateObtained: string;
  foiRequestId: string;
  url: string;
  usageTerms: string;
}
// Owner fills each source here once. Never infer an exact citation from a filename.
export const sourceMetadata: Record<string, SourceMetadata> = {
  "ncr_dengue_monthly_with_rates.csv": {
    title: PENDING, issuingOffice: PENDING, dateObtained: PENDING,
    foiRequestId: PENDING, url: PENDING, usageTerms: PENDING,
  },
  "doh-epi-dengue-data-2016-2021.csv": {
    title: PENDING, issuingOffice: PENDING, dateObtained: PENDING,
    foiRequestId: PENDING, url: PENDING, usageTerms: PENDING,
  },
  "Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx": {
    title: PENDING, issuingOffice: PENDING, dateObtained: PENDING,
    foiRequestId: PENDING, url: PENDING, usageTerms: PENDING,
  },
};
export const publishedSources = [
  { source: "ncr_dengue_monthly_with_rates.csv", period: "month", label: "NCR monthly" },
  { source: "doh-epi-dengue-data-2016-2021.csv", period: "week", label: "NCR weekly" },
  { source: "Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx", period: "day", label: "Manila daily only" },
] as const;
export function pendingCitationFields(): string[] {
  return Object.entries(sourceMetadata).flatMap(([source, metadata]) =>
    Object.entries(metadata).filter(([, value]) => value === PENDING).map(([field]) => `${source}: ${field}`),
  );
}
export function sourceAttribution(): string {
  return pendingCitationFields().length
    ? `DOH/FOI ${CITATION_PENDING}`
    : [...new Set(Object.values(sourceMetadata).map(source => source.issuingOffice))].join("; ");
}
