import { useAppData } from "../lib/resources";
import { UnverifiedBadge } from "./UnverifiedBadge";
import { Card } from "./ui";
import { RiskBadge } from "./RiskBadge";
import { formatDate } from "../lib/dates";
import { currentRisk, historicalOnly } from "../lib/forecast";
import type { Forecast } from "../lib/types";
export function ForecastPanel({
  forecast,
}: {
  forecast: Forecast | undefined;
}) {
  const { risks } = useAppData();
  const inputs = risks.data?.find((r) => r.lgu_id === forecast?.lgu_id)?.inputs;
  if (!forecast)
    return (
      <Card>
        <h2>Forecast not available</h2>
        <p className="muted">
          No saved estimate is available for this city yet.
        </p>
        <RiskBadge level="Insufficient data" />
      </Card>
    );
  const old = historicalOnly(forecast);
  return (
    <Card className="forecast-panel">
      <div className="section-heading">
        <h2>Forecast & explanation</h2>
        <RiskBadge level={currentRisk(forecast)} />
      </div>
      <p className="data-notice">
        {old
          ? "Historical estimate only. These observations are too old to describe current conditions."
          : "Model signal for this month; not an official alert or individual diagnosis."}
      </p>
      <div className="forecast-numbers">
        <div>
          <span className="muted">Estimated cases</span>
          <strong>
            {forecast.predicted_cases === null
              ? "—"
              : forecast.predicted_cases.toFixed(1)}
          </strong>
        </div>
        <div>
          <span className="muted">Forecast month</span>
          <strong className="forecast-date">
            {formatDate(forecast.forecast_for)}
          </strong>
        </div>
      </div>
      <p>
        Historical signal: <RiskBadge level={forecast.risk_label} />{" "}
        <span className="muted">
          Based on data through {formatDate(forecast.data_as_of)}.
        </span>
      </p>
      <p className="muted">{forecast.reason}</p>
      <details className="method-details">
        <summary>Inspect factor contributions</summary>
        {risks.loading ? (
          <p>Loading saved factors…</p>
        ) : risks.error ? (
          <p>
            Factor breakdown unavailable.{" "}
            <button className="text-link" onClick={risks.retry}>
              Retry factors
            </button>
          </p>
        ) : !inputs ? (
          <p>No saved factor breakdown yet.</p>
        ) : (
          <>
            <p>
              Saved factors evaluated on {formatDate(inputs.evaluated_on)}.
              Scope: city, not barangay.
            </p>
            <p>
              Trend: {(inputs.trend.weight * 100).toFixed(0)}% weight;{" "}
              {inputs.trend.contribution?.toFixed(2) ?? "unavailable"} cases
              contributed.
            </p>
            <p>
              Seasonality: {(inputs.seasonality.weight * 100).toFixed(0)}%
              weight; ratio{" "}
              {inputs.seasonality.ratio?.toFixed(2) ?? "unavailable"} for the
              forecast month;{" "}
              {inputs.seasonality.contribution?.toFixed(2) ?? "unavailable"}{" "}
              cases contributed. {inputs.seasonality.status}.
            </p>
            <p>
              Calendar-month context (
              {inputs.current_calendar_seasonality.month}): historical ratio{" "}
              {inputs.current_calendar_seasonality.ratio?.toFixed(2) ??
                "unavailable"}
              .{" "}
              {inputs.current_calendar_seasonality.high_season === null
                ? "Insufficient seasonal history."
                : inputs.current_calendar_seasonality.high_season
                  ? "Historically above the yearly average."
                  : "Historically at or below the yearly average."}{" "}
              This does not establish current risk.
            </p>
            <UnverifiedBadge />
            <p>
              Community: 0% weight. {inputs.community.signal.status} Direction:{" "}
              {inputs.community.signal.direction ?? "unavailable"}. No aligned
              historical validation; cannot elevate risk.
            </p>
            <p>Weather: 0% weight. {inputs.weather.status}.</p>
            <p>
              Candidate formula: 75% × trend + 25% × trend × seasonal ratio.
              Retain only with at least 5% lower mean absolute error in both
              development and holdout, plus improvement in a majority of cities.
              See the repository backtest report for paired predictions and
              limitations.
            </p>
          </>
        )}
      </details>
      <details className="method-details">
        <summary>How this estimate is calculated</summary>
        <p>
          The oldest, middle, and newest eligible months receive weights 1, 2,
          and 3. Divide their weighted sum by 6. These are the three most recent
          complete source-label months; excluded months can leave gaps.
        </p>
        {forecast.input_periods.length > 0 && (
          <ul>
            {forecast.input_periods.map((point) => (
              <li key={point.date}>
                {formatDate(point.date)}: {point.cases} cases × {point.weight}
              </li>
            ))}
          </ul>
        )}
        <p>
          Low: at or below the city’s median (
          {forecast.p50?.toFixed(1) ?? "unavailable"}). Medium: above the median
          and at or below its 80th percentile (
          {forecast.p80?.toFixed(1) ?? "unavailable"}). High: above the 80th
          percentile.
        </p>
        <p>
          Baseline: {forecast.baseline_count} eligible months,{" "}
          {formatDate(forecast.baseline_start)} to{" "}
          {formatDate(forecast.baseline_end)}. At least 24 months and distinct
          thresholds are required. Partial months, missing weekly labels, and
          flagged suspect aggregates are excluded. Weekly and daily sources are
          never combined with monthly data.
        </p>
        <p>
          This model has not been validated for clinical or outbreak decisions
          and has no claimed accuracy or confidence interval. Community reports
          never affect it.
        </p>
        <p className="muted">
          Method: {forecast.method_version}. Computed{" "}
          {formatDate(forecast.computed_at)}. Current labels expire at the end
          of the forecast month.
        </p>
      </details>
    </Card>
  );
}
