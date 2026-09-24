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
          This simple baseline has not been validated for clinical or outbreak
          decisions and has no claimed accuracy or confidence interval.
          Community reports never affect it.
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
