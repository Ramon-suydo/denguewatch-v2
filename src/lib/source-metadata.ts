export const PENDING = "unknown";
export const CITATION_PENDING = "Formal citation details unknown; data-owner confirmation required.";
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
    title: "NCR Dengue Monthly with Rates (ncr_dengue_monthly_with_rates.csv)",
    issuingOffice: "Derived from the NCR weekly DOH file; not an independent source",
    dateObtained: "Not available", foiRequestId: "Not available", url: "not public", usageTerms: "Not stated",
  },
  "doh-epi-dengue-data-2016-2021.csv": {
    title: "DOH EPI Dengue Data 2016-2021 (doh-epi-dengue-data-2016-2021.csv), filtered to National Capital Region",
    issuingOffice: "Department of Health Epidemiology Bureau weekly surveillance data (EPI)",
    dateObtained: "Not available", foiRequestId: "Not available", url: "not public", usageTerms: "Not stated",
  },
  "Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx": {
    title: "Daily Reported Cases of Dengue in the City of Manila, 2018 to 2023 (workbook)",
    issuingOffice: "Provided by the City of Manila health department to the project team; formal citation pending data owner",
    dateObtained: "Not available", foiRequestId: "Not available", url: "not public", usageTerms: "Not stated",
  },
};
export const publishedSources = [
  { source: "ncr_dengue_monthly_with_rates.csv", period: "month", label: "NCR monthly" },
  { source: "doh-epi-dengue-data-2016-2021.csv", period: "week", label: "NCR weekly" },
  { source: "Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx", period: "day", label: "Manila daily only" },
] as const;
export function pendingCitationFields(): string[] {
  return Object.entries(sourceMetadata).flatMap(([source, metadata]) =>
    Object.entries(metadata).filter(([, value]) => value === PENDING || /^(not available|not public|not stated)$/i.test(value) || value.includes("not confirmed")).map(([field]) => `${source}: ${field}`),
  );
}
export function sourceAttribution(): string {
  return pendingCitationFields().length
    ? `Source details: ${CITATION_PENDING}`
    : [...new Set(Object.values(sourceMetadata).map(source => source.issuingOffice))].join("; ");
}

// Map inputs are distinct from the dengue surveillance files and their citations.
export const mapSourceMetadata: Record<string, SourceMetadata> = {
 boundaries: {title:"Tondo boundaries, unsimplified HDX COD-AB Philippines v03",issuingOffice:"NAMRIA, distributed by OCHA Philippines / HDX",dateObtained:"2026-10-04",foiRequestId:"None; public HDX COD-AB dataset",url:"https://data.humdata.org/dataset/cod-ab-phl",usageTerms:"CC BY 3.0 IGO; retain NAMRIA/OCHA attribution. PSGC crosswalk from MIT repository"},
 population: {title:"PSA 2020 CPH: Total Population by Barangay, City of Manila",issuingOffice:"Philippine Statistics Authority, NCR Provincial Statistical Office I",dateObtained:"2026-10-04",foiRequestId:"None; public PSA publication",url:"https://rssoncr.psa.gov.ph/sites/default/files/Manila_0.pdf",usageTerms:"Not stated in the publication; attribution retained"},
};
