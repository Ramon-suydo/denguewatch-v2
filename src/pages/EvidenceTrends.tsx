import { colors } from "../theme/palette.js";
import { useState } from "react";
import { Card, Select } from "../components/ui";
import { ReadState } from "../components/PageState";
import { EvidenceForecastChart } from "../components/EvidenceForecastChart";
import { ScenarioControl } from "../components/EvidenceControls";
import { useResource } from "../lib/resources";
import { loadEvidence, number, type Scenario } from "../lib/evidence";
import type { ManilaWeek } from "../../scripts/lib/manila-data";
export function History({ rows }: { rows: ManilaWeek[] }) {
  const valid = rows.filter((r) => r.cases !== null);
  if (!valid.length) return <p>No reliable weeks in this selection.</p>;
  const first = Date.parse(rows[0].week_ending),
    last = Date.parse(rows.at(-1)!.week_ending),
    max = Math.max(1, ...valid.map((r) => r.cases!));
  const x = (date: string) =>
      55 + ((Date.parse(date) - first) / Math.max(1, last - first)) * 800,
    y = (value: number) => 275 - (value / max) * 230;
  const segments: string[] = [];
  let line = "";
  for (const row of rows) {
    if (row.cases === null) {
      if (line) segments.push(line);
      line = "";
    } else
      line +=
        (line ? "L" : "M") +
        x(row.week_ending).toFixed(2) +
        "," +
        y(row.cases).toFixed(2);
  }
  if (line) segments.push(line);
  const covidStart = Math.max(55, x("2020-01-01")),
    covidEnd = Math.min(855, x("2021-12-31"));
  return (
    <figure tabIndex={0} aria-label="Scrollable Manila history chart">
      <svg
        role="img"
        aria-labelledby="history-title history-desc"
        viewBox="0 0 900 330"
        className="evidence-chart"
      >
        <title id="history-title">Manila weekly case history</title>
        <desc id="history-desc">
          {valid.length} observed or scenario-defined weeks. Peak{" "}
          {Math.max(...valid.map((r) => r.cases!))} cases. Gaps break the line.
          Shading marks the COVID period. Exact data appears in the table below.
        </desc>
        {covidEnd > covidStart && (
          <rect
            x={covidStart}
            y={35}
            width={covidEnd - covidStart}
            height={245}
            fill={colors.neutral[100]}
            stroke={colors.neutral[500]}
            strokeDasharray="5 5"
          />
        )}
        {Array.from({ length: 5 }, (_, i) => i).map((i) => (
          <g key={i}>
            <line
              x1={55}
              x2={855}
              y1={y((max * i) / 4)}
              y2={y((max * i) / 4)}
              stroke={colors.neutral[300]}
            />
            <text
              x={48}
              y={y((max * i) / 4) + 5}
              textAnchor="end"
              fontSize={15}
              fill={colors.navy[700]}
            >
              {Math.round((max * i) / 4)}
            </text>
          </g>
        ))}
        {covidEnd > covidStart && (
          <text x={covidStart + 8} y={75} fill={colors.navy[700]}>
            COVID period
          </text>
        )}
        {segments.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={colors.navy[600]}
            strokeWidth={3}
          />
        ))}
        <text x={55} y={310} fontSize={15} fill={colors.navy[700]}>
          {rows[0].week_ending}
        </text>
        <text
          x={855}
          y={310}
          textAnchor="end"
          fontSize={15}
          fill={colors.navy[700]}
        >
          {rows.at(-1)!.week_ending}
        </text>
        <text x={55} y={22} fontSize={16} fill={colors.navy[700]}>
          Weekly cases · gaps remain gaps
        </text>
        {first < Date.parse("2018-01-01") &&
          last > Date.parse("2018-01-01") && (
            <>
              <line
                x1={x("2018-01-01")}
                x2={x("2018-01-01")}
                y1={30}
                y2={280}
                stroke={colors.navy[700]}
                strokeDasharray="5 5"
              />
              <text
                x={x("2018-01-01") + 8}
                y={50}
                fontSize={15}
                fill={colors.navy[700]}
              >
                Source changes
              </text>
            </>
          )}
      </svg>
      <figcaption>
        DOH EPI before 2018; Manila daily-derived weeks from 2018. COVID period
        shaded (2020–2021). Source dates end 2023-12-02; final partial week
        excluded. Sunday labels operationally interpreted as week-ending; source
        semantics unconfirmed.
      </figcaption>
    </figure>
  );
}
export function EvidenceTrends() {
  const data = useResource("manila-v2", loadEvidence),
    [scenario, setScenario] = useState<Scenario>("M"),
    [year, setYear] = useState("all");
  return (
    <div className="ui-container app-content evidence-page">
      <p className="eyebrow">HISTORY / MANILA ONLY</p>
      <h1>Trends with their context.</h1>
      <p>
        Different source periods, missing observations, and pandemic disruption
        remain visible.
      </p>
      <ReadState resource={data}>
        {(value) => {
          const rows = value.series[scenario].filter(
              (r) => year === "all" || r.week_ending.startsWith(year),
            ),
            snapshot = value.snapshots.find((s) => s.scenario === scenario)!;
          return (
            <>
              <ScenarioControl value={scenario} onChange={setScenario} />
              <Select
                label="History year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="all">All years · 2016–2023</option>
                {Array.from({ length: 8 }, (_, i) => 2016 + i).map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </Select>
              <Card>
                <h2>Weekly recorded cases</h2>
                <History rows={rows} />
                <details>
                  <summary>Exact weekly values and quality flags</summary>
                  <div
                    className="table-scroll"
                    role="region"
                    aria-label="Weekly history data table"
                    tabIndex={0}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Week ending</th>
                          <th scope="col">Cases (scenario {scenario})</th>
                          <th scope="col">Days with rows</th>
                          <th scope="col">Source / flags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.week_ending}>
                            <th scope="row">{r.week_ending}</th>
                            <td>
                              {r.cases === null
                                ? "Missing / excluded"
                                : number(r.cases, 0)}
                            </td>
                            <td>{r.days_with_rows ?? "Weekly source"}</td>
                            <td>
                              {r.source.startsWith("doh")
                                ? "DOH EPI"
                                : "Manila daily"}{" "}
                              · {r.flags.join(", ") || "No additional flags"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </Card>
              <Card>
                <h2>Year comparison</h2>
                <p>
                  Totals cover available scenario-defined weeks, not necessarily
                  complete years. Never add source representations together.
                </p>
                <div
                  className="table-scroll"
                  role="region"
                  aria-label="Year comparison"
                  tabIndex={0}
                >
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Year</th>
                        <th scope="col">Cases in available weeks</th>
                        <th scope="col">Available / calendar weeks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.year_comparison.map((r) => (
                        <tr key={r.year}>
                          <th scope="row">{r.year}</th>
                          <td>
                            {number(r.scorable_cases, 0)}{" "}
                            {!r.complete && "· incomplete"}
                          </td>
                          <td>
                            {r.observed_week_count} / {r.calendar_week_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="muted">
                  DOH EPI 2016–2017; Manila daily-derived 2018–2023. As of{" "}
                  {value.data_as_of}.
                </p>
              </Card>
              <Card>
                <h2>Historical forecast and interval</h2>
                <p>
                  Origin {snapshot.as_of}. Exploratory four-week forecasts have
                  larger error; they are not operational warnings.
                </p>
                <EvidenceForecastChart
                  rows={snapshot.forecasts}
                  origin={snapshot.as_of}
                />
                <div
                  className="table-scroll"
                  role="region"
                  aria-label="Forecast intervals"
                  tabIndex={0}
                >
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Target</th>
                        <th scope="col">Horizon</th>
                        <th scope="col">Forecast cases</th>
                        <th scope="col">80% interval</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.forecasts.map((f) => (
                        <tr key={f.target}>
                          <th scope="row">{f.target}</th>
                          <td>
                            {f.horizon} weeks{" "}
                            {f.horizon === 4 && "· exploratory"}
                          </td>
                          <td>{number(f.predicted)}</td>
                          <td>
                            {f.low80 === null
                              ? "Unavailable"
                              : `${number(f.low80)}–${number(f.high80)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="muted">
                  Source: daily-derived Manila series. {snapshot.model_version};
                  interval calibration uses earlier observed out-of-sample
                  errors only. Not current risk.
                </p>
              </Card>
            </>
          );
        }}
      </ReadState>
    </div>
  );
}
