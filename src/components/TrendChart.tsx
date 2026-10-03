import { useId } from "react";
import { colors } from "../theme/palette.js";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
export type TrendPoint = {
  week: string;
  cases: number | null;
  previous: number | null;
};
export function TrendChart({
  data,
  title = "Weekly reported cases",
}: {
  data: TrendPoint[];
  title?: string;
}) {
  const id = useId();
  return (
    <figure aria-labelledby={id}>
      <figcaption id={id} className="sr-only">
        {title}. Solid navy: selected period. Dashed gray: previous period.
        Exact values in the table below.
      </figcaption>
      <p className="chart-takeaway">{data.filter(point => point.cases !== null).length} of {data.length} displayed weeks have reported counts; missing weeks remain gaps.</p>
      {data.length ? (
        <>
          <div className="chart-legend">
            <span>
              <i className="legend-current" />
              Selected period
            </span>
            <span>
              <i className="legend-previous" />
              Previous period
            </span>
          </div>
          <div className="trend-chart">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart
                data={data}
                accessibilityLayer
                margin={{ top: 16, right: 20, bottom: 8, left: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke={colors.neutral[200]}
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: colors.neutral[600], fontSize: 16 }}
                  minTickGap={24}
                  dy={10}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: colors.neutral[600], fontSize: 16 }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: colors.neutral[400],
                    fontSize: 16,
                  }}
                />
                <Line
                  name="Previous period"
                  dataKey="previous"
                  type="linear"
                  stroke={colors.neutral[500]}
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  name="Selected period"
                  dataKey="cases"
                  type="linear"
                  stroke={colors.navy[600]}
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <details className="chart-table">
            <summary>View chart data</summary>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Chart data table"
            >
              <table>
                <caption>{title}</caption>
                <thead>
                  <tr>
                    <th scope="col">Week</th>
                    <th scope="col">Selected period</th>
                    <th scope="col">Previous period</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((point) => (
                    <tr key={point.week}>
                      <th scope="row">{point.week}</th>
                      <td>{point.cases ?? "No data"}</td>
                      <td>{point.previous ?? "No data"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="empty-state">
          No observations available for this period.
        </p>
      )}
    </figure>
  );
}
