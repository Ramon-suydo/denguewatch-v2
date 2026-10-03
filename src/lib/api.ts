import { readPublished, requireOnlineMutation } from "./demo-snapshot";
import { getSupabase } from "./supabase";
import type {
  City,
  CommunityPolicy,
  CommunityWeek,
  Forecast,
  Observation,
  PeriodType,
} from "./types";
import { recentMonday } from "./dates";
import { publishedSources } from "./source-metadata";
function check(error: { message: string } | null) {
  if (error)
    throw new Error(
      "The data service could not complete this request. Please try again.",
    );
}
async function onlineSourceCoverage(signal: AbortSignal) {
  return Promise.all(publishedSources.map(async ({ source, period, label }) => {
    const { data, error } = await getSupabase()
      .from("historical_surveillance")
      .select("period_start")
      .eq("source", source)
      .eq("period_type", period)
      .order("period_start", { ascending: false })
      .limit(1)
      .abortSignal(signal)
      .retry(false);
    check(error);
    return { source, period, label, date: data?.[0]?.period_start ?? null };
  }));
}
async function onlineRisks(
  signal: AbortSignal,
): Promise<import("../components/CityGrid").RiskRecord[]> {
  const { data, error } = await getSupabase()
    .from("barangay_risk")
    .select("lgu_id,inputs")
    .abortSignal(signal)
    .retry(false);
  check(error);
  return data ?? [];
}
async function onlineCities(signal: AbortSignal): Promise<City[]> {
  const { data, error } = await getSupabase()
    .from("lgus")
    .select("id,name,psgc_code,population,population_year,population_source")
    .eq("is_active", true)
    .order("name")
    .abortSignal(signal)
    .retry(false);
  check(error);
  return data ?? [];
}
async function onlineForecasts(signal: AbortSignal): Promise<Forecast[]> {
  const { data, error } = await getSupabase()
    .from("city_forecasts")
    .select("*")
    .order("lgu_id")
    .abortSignal(signal)
    .retry(false);
  check(error);
  return data ?? [];
}
async function onlineCommunity(
  signal: AbortSignal,
): Promise<CommunityWeek[]> {
  const { data, error } = await getSupabase()
    .rpc("community_reports_weekly_agg")
    .gte("week_start", recentMonday())
    .order("week_start")
    .abortSignal(signal)
    .retry(false);
  check(error);
  return data ?? [];
}
async function onlinePolicy(
  signal: AbortSignal,
): Promise<CommunityPolicy> {
  const { data, error } = await getSupabase()
    .from("community_policy")
    .select("*")
    .eq("id", true)
    .abortSignal(signal)
    .retry(false)
    .single();
  check(error);
  if (!data) throw new Error("The participation notice is not available yet.");
  return data;
}
async function onlineHistory(
  city: string,
  period: PeriodType,
  signal: AbortSignal,
): Promise<Observation[]> {
  const all: Observation[] = [];
  // PostgREST caps results; Manila's daily series needs multiple pages. Stable
  // ordering prevents silent truncation and never merges overlapping sources.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await getSupabase()
      .from("historical_surveillance")
      .select(
        "id,lgu_id,period_start,period_type,cases,source,source_citation,incidence_per_100k,population,population_year,weeks_reported,quality_flags",
      )
      .eq("lgu_id", city)
      .eq("period_type", period)
      .order("period_start")
      .order("id")
      .range(offset, offset + 499)
      .abortSignal(signal)
      .retry(false);
    check(error);
    all.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  return all;
}
export const fetchSourceCoverage = (signal: AbortSignal) => readPublished(signal, onlineSourceCoverage,
  snapshot => publishedSources.map(({ source, period, label }) => ({ source, period, label, date: snapshot.coverage.find(row => row.source === source)?.date ?? null })));
export const fetchCities = (signal: AbortSignal) => readPublished(signal, onlineCities, snapshot => snapshot.cities);
export const fetchForecasts = (signal: AbortSignal) => readPublished(signal, onlineForecasts, snapshot => snapshot.forecasts);
export const fetchRisks = (signal: AbortSignal) => readPublished(signal, onlineRisks, snapshot => snapshot.risks);
export const fetchHistory = (city: string, period: PeriodType, signal: AbortSignal) => readPublished(signal,
  child => onlineHistory(city, period, child), snapshot => snapshot.history.filter(row => row.lgu_id === city && row.period_type === period));
export const fetchCommunity = (signal: AbortSignal) => readPublished(signal, onlineCommunity, () => {
  throw new Error("Community reports are unavailable in the offline demo; no counts are inferred.");
});
export const fetchPolicy = (signal: AbortSignal) => readPublished(signal, onlinePolicy, () => ({
  id: true, retention_days: 90, contact_email: null, submissions_enabled: false, consent_version: "community-v1",
}));
export interface ReportInput {
  city: string;
  date: string;
  status: string;
  barangay: string;
  contactOptIn: boolean;
  contact: string;
  consent: boolean;
}
export async function submitReport(
  input: ReportInput,
  version: string,
): Promise<string> {
  requireOnlineMutation();
  const { data, error } = await getSupabase().rpc("submit_community_report", {
    p_lgu_id: input.city,
    p_report_date: input.date,
    p_status: input.status,
    p_consent_version: version,
    p_consent_given: input.consent,
    p_barangay_text: input.barangay.trim() || null,
    p_contact_opt_in: input.contactOptIn,
    p_contact_value: input.contactOptIn ? input.contact.trim() : null,
  });
  if (error) {
    if (error.code === "P0001" || error.code === "22023")
      throw new Error(error.message);
    throw new Error(
      "We could not confirm whether the report was saved. Do not submit again automatically. Contact the research team if you need help.",
    );
  }
  if (typeof data !== "string" || !/^DW-[A-F0-9]{24}$/.test(data))
    throw new Error(
      "The service did not return a valid reference code. Contact the research team before resubmitting.",
    );
  return data;
}
export async function deleteReport(code: string): Promise<void> {
  requireOnlineMutation();
  const { error } = await getSupabase().rpc("delete_community_report", {
    p_reference_code: code.trim().toUpperCase(),
  });
  check(error);
}
