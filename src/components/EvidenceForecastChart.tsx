import { colors } from "../theme/palette.js";
import type { Forecast } from "../lib/evidence";
export function EvidenceForecastChart({
  rows,
  origin,
}: {
  rows: Forecast[];
  origin: string;
}) {
  if (!rows.length)
    return <p>No supported historical forecast for this selection.</p>;
  const max = Math.max(1, ...rows.map((r) => r.high80 ?? r.predicted)),
    x = (h: number) => 80 + (h / 4) * 540,
    y = (n: number) => 230 - (n / max) * 180;
  const points = rows.map((r) => `${x(r.horizon)},${y(r.predicted)}`).join(" ");
  return (
    <figure tabIndex={0} aria-label="Scrollable historical forecast chart">
      <svg
        className="evidence-chart"
        viewBox="0 0 720 300"
        role="img"
        aria-labelledby="forecast-plot-title forecast-plot-desc"
      >
        <title id="forecast-plot-title">
          Historical persistence forecasts with 80% intervals
        </title>
        <desc id="forecast-plot-desc">
          Origin {origin}. One and two weeks are primary; four weeks is
          exploratory. Vertical bars show nominal 80% intervals from earlier
          observed forecast errors. Exact estimates and ranges are in the
          following table.
        </desc>
        <line x1={60} x2={660} y1={230} y2={230} stroke={colors.neutral[500]} />
        <polyline
          points={points}
          fill="none"
          stroke={colors.navy[600]}
          strokeWidth={3}
          strokeDasharray="8 5"
        />
        {rows.map((r) => (
          <g key={r.horizon}>
            {r.low80 !== null && r.high80 !== null && (
              <>
                <line
                  x1={x(r.horizon)}
                  x2={x(r.horizon)}
                  y1={y(r.low80)}
                  y2={y(r.high80)}
                  stroke={colors.navy[700]}
                  strokeWidth={3}
                />
                <line
                  x1={x(r.horizon) - 8}
                  x2={x(r.horizon) + 8}
                  y1={y(r.low80)}
                  y2={y(r.low80)}
                  stroke={colors.navy[700]}
                  strokeWidth={3}
                />
                <line
                  x1={x(r.horizon) - 8}
                  x2={x(r.horizon) + 8}
                  y1={y(r.high80)}
                  y2={y(r.high80)}
                  stroke={colors.navy[700]}
                  strokeWidth={3}
                />
              </>
            )}
            <circle
              cx={x(r.horizon)}
              cy={y(r.predicted)}
              r={6}
              fill={colors.navy[600]}
            />
            <text
              x={x(r.horizon)}
              y={265}
              textAnchor="middle"
              fill={colors.navy[700]}
            >
              {r.horizon} week{r.horizon > 1 ? "s" : ""}
            </text>
          </g>
        ))}
        <text x={60} y={28} fill={colors.navy[700]}>
          Cases · historical estimates, not current alerts
        </text>
        <text x={48} y={235} textAnchor="end" fill={colors.navy[700]}>
          0
        </text>
        <text x={48} y={55} textAnchor="end" fill={colors.navy[700]}>
          {Math.ceil(max)}
        </text>
      </svg>
      <figcaption>
        Source: Manila daily-derived weekly series; origin {origin}. Dot =
        estimate, vertical bar = nominal 80% interval. Four weeks is
        exploratory. Scroll the chart if needed; exact values follow.
      </figcaption>
    </figure>
  );
}
