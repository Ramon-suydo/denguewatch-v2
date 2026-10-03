import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Select } from "./ui";
import { SourceCitation } from "./SourceCitation";
import { colors } from "../theme/palette.js";
import type { Observation, PeriodType } from "../lib/types";
import { formatDate, nextMonth } from "../lib/dates";
export function displaySeries(
  rows: Observation[],
  period: PeriodType,
  metric: "cases" | "incidence",
) {
  if (!rows.length) return [];
  const byDate = new Map(rows.map((row) => [row.period_start, row]));
  const result: { date: string; value: number | null }[] = [];
  let date = rows[0].period_start;
  const last = rows.at(-1)!.period_start;
  while (date <= last) {
    const row = byDate.get(date);
    const value = !row
      ? null
      : metric === "cases"
        ? row.cases
        : row.incidence_per_100k !== null
          ? Number(row.incidence_per_100k)
          : null;
    result.push({ date, value });
    if (period === "month") date = nextMonth(date);
    else {
      const next = new Date(date + "T00:00:00Z");
      next.setUTCDate(next.getUTCDate() + (period === "week" ? 7 : 1));
      date = next.toISOString().slice(0, 10);
    }
  }
  return result;
}
export function HistoryChart({
  rows,
  period,
  metric = "cases",
}: {
  rows: Observation[];
  period: PeriodType;
  metric?: "cases" | "incidence";
}) {
  const [source, setSource] = useState("");
  const sources = [...new Set(rows.map((row) => row.source))];
  const chosen = sources.includes(source) ? source : sources[0];
  const data = useMemo(
    () =>
      displaySeries(
        rows.filter((row) => row.source === chosen),
        period,
        metric,
      ),
    [rows, chosen, period, metric],
  );
  const [tablePage, setTablePage] = useState(0);
  const pageCount = Math.ceil(data.length / 40);
  const safePage = Math.min(tablePage, Math.max(0, pageCount - 1));
  const unit = metric === "cases" ? "Reported cases" : "Cases per 100,000";
  if (!rows.length)
    return (
      <p className="empty-state">
        No{" "}
        {period === "day" ? "daily" : period === "week" ? "weekly" : "monthly"}{" "}
        observations are available for this city.
      </p>
    );
  if (data.every((point) => point.value === null))
    return (
      <p className="empty-state">
        Incidence is not published for this source. Select monthly data to view
        the supplied rates using the fixed 2020 population denominator.
      </p>
    );
  const observed = data.filter(point => point.value !== null);
  const latest = observed.at(-1)!;
  const peak = observed.reduce((best, point) => point.value! > best.value! ? point : best);
  const reported = new Set(rows.filter(row => row.source === chosen).map(row => row.period_start));
  return (
    <figure>
      <p className="chart-takeaway">The latest reported value is {latest.value!.toLocaleString("en-PH")} {metric === "cases" ? "cases" : "cases per 100,000"} on {formatDate(latest.date)}; the highest in this series is {peak.value!.toLocaleString("en-PH")} on {formatDate(peak.date)}.</p>
      <figcaption className="chart-caption">
        {unit} · {formatDate(data[0]?.date)} — {formatDate(data.at(-1)?.date)}
      </figcaption>
      {sources.length > 1 && (
        <Select
          label="Source series"
          value={chosen}
          onChange={(event) => setSource(event.target.value)}
        >
          {sources.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
      )}
      <div className="history-chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            data={data}
            accessibilityLayer
            margin={{ top: 20, right: 24, bottom: 10, left: 10 }}
          >
            <CartesianGrid
              vertical={false}
              stroke={colors.neutral[200]}
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="date"
              minTickGap={60}
              tick={{ fill: colors.neutral[600], fontSize: 16 }}
              tickFormatter={(date) =>
                new Date(date + "T00:00:00Z").toLocaleDateString("en-PH", {
                  month: "short",
                  year: "2-digit",
                  timeZone: "UTC",
                })
              }
            />
            <YAxis
              width={55}
              allowDecimals={metric === "incidence"}
              tick={{ fill: colors.neutral[600], fontSize: 16 }}
            />
            <Tooltip
              labelFormatter={(value) => formatDate(String(value))}
              formatter={(value) => [
                Number(value).toLocaleString("en-PH", {
                  maximumFractionDigits: 2,
                }),
                unit,
              ]}
            />
            <Line
              name={unit}
              type="linear"
              dataKey="value"
              stroke={colors.navy[600]}
              strokeWidth={2}
              dot={data.length < 80}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="muted chart-caption">
        Gaps are missing observations, not zero.{" "}
        {period === "week"
          ? "Weekly dates retain source labels; start/end boundaries are unconfirmed."
          : ""}
        {metric === "incidence"
          ? "Rates use the source’s fixed 2020 population, not current population."
          : ""}
      </p>
      <div className="chart-legend"><span><i className="legend-missing" />Not reported (no source row)</span><span><i className="legend-zero" />Reported zero (0)</span></div>
      <details className="chart-table">
        <summary>
          View exact {metric === "cases" ? "case" : "incidence"} values
        </summary>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label={unit}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Source date</th>
                <th scope="col">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(safePage * 40, (safePage + 1) * 40).map((point) => (
                <tr key={point.date}>
                  <th scope="row">{formatDate(point.date)}</th>
                  <td>
                    {point.value?.toLocaleString("en-PH", {
                      maximumFractionDigits: 2,
                    }) ?? (reported.has(point.date) ? "Rate unavailable" : "Not reported")}{point.value === 0 && metric === "cases" ? " (reported zero)" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button
            className="ui-button ui-button-secondary"
            disabled={safePage === 0}
            onClick={() => setTablePage(safePage - 1)}
          >
            Previous
          </button>
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            className="ui-button ui-button-secondary"
            disabled={safePage + 1 >= pageCount}
            onClick={() => setTablePage(safePage + 1)}
          >
            Next
          </button>
        </div>
      </details>
      <details className="source-details">
        <summary>Source & data quality</summary>
        <p>{chosen}</p>
        <SourceCitation source={chosen} />
        <p>
          Published source values are preserved, including partial periods and
          quality flags. The weekly forecast uses only the weekly source;
          the separate legacy monthly risk display uses eligible historical months. Monthly data is
          derived from weekly data and must not be added to it. Manila daily
          totals differ from the weekly source.
        </p>
        <p>
          Quality flags in this series:{" "}
          {[
            ...new Set(
              rows
                .filter((row) => row.source === chosen)
                .flatMap((row) => row.quality_flags),
            ),
          ].join(", ") || "None recorded"}
          .
        </p>
      </details>
    </figure>
  );
}
