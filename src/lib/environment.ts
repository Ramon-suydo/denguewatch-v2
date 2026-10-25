import type { Summary } from "./evidence";
export type EnvironmentEvidence = {
  version: 2;
  historical_only: true;
  metadata: {
    training: string;
    paired_support: string;
    features: string;
    thermal: string;
    calibration: string;
  };
  design: {
    comparison: {
      n: number;
      rainfall_r: number | null;
      temperature_r: number | null;
      rainfall_mae_mm: number | null;
      temperature_mae_c: number | null;
      time_caveat: string;
    };
    profile: {
      scenario: string;
      month: number;
      n: number;
      mean_cases: number | null;
      complete_n: number;
      complete_mean_cases: number | null;
    }[];
    lags: Record<
      string,
      {
        rain: number;
        temperature: number;
        humidity: number;
        rain_window: number;
        cutoff: string;
      }
    >;
  };
  summaries: Summary[];
  leads: {
    scenario: string;
    model: string;
    eligible_onsets: number;
    detected_onsets: number;
    mean_lead_weeks: number | null;
  }[];
};
export type GeographyEvidence = {
  version: 2;
  historical_only: true;
  metadata: {
    label: string;
    n: number;
    period: string;
    water: string;
    elevation: string;
    area: string;
    vintage: string;
    ci: string;
    confounding: string;
    biology: string;
    omitted: string;
  };
  rows: {
    city: string;
    area_km2: number;
    density_per_km2: number;
    water_share_200m: number;
    water_share_500m: number;
    centroid_river_distance_m: number;
    sample_mean_elevation_m: number;
    sample_share_below_5m: number;
    elevation_sample_n: number;
    mean_weekly_incidence_2016_2019: number;
  }[];
  correlations: {
    feature: string;
    n: number;
    rho: number | null;
    low: number | null;
    high: number | null;
  }[];
};
async function load<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });
  if (!response.ok)
    throw Error(
      "Environmental context unavailable. Baseline forecasts remain available.",
    );
  const value = await response.json();
  if (value.version !== 2 || value.historical_only !== true)
    throw Error("Invalid environmental context");
  return value;
}
export const loadEnvironment = (signal: AbortSignal) =>
  load<EnvironmentEvidence>("/api/v2/environment.json", signal);
export const loadGeography = (signal: AbortSignal) =>
  load<GeographyEvidence>("/api/v2/geography.json", signal);
export function seasonalContext(month: number, fil = false) {
  const rainy = month >= 6 && month <= 11;
  return fil
    ? rainy
      ? "Hunyo hanggang Nobyembre ang tag-ulan ayon sa PAGASA. Alisin ang mga lalagyang may naiipong tubig. Konteksto lamang ito ng panahon; hindi pagtataya o babala ng dengue."
      : "Disyembre hanggang Mayo ang tag-init/tagtuyot ayon sa PAGASA. Patuloy na alisin ang mga lalagyang may naiipong tubig. Konteksto lamang ito; hindi pagtataya ng dengue."
    : rainy
      ? "PAGASA defines June to November as the rainy season. Clear containers of standing water and keep up bite prevention. This is seasonal context, not a dengue prediction or alert."
      : "PAGASA defines December to May as the dry season. Continue clearing containers of standing water. Seasonal context does not establish dengue risk.";
}

export type WeatherContext = {
  version: 2;
  historical_only: true;
  attempted_at: string;
  status: string;
  weather_as_of: string | null;
  message: string;
  dengue_as_of: string;
  model: string;
};
export const loadWeatherContext = (signal: AbortSignal) =>
  load<WeatherContext>("/api/v2/weather.json", signal);
