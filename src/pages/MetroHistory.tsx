import { useState } from "react";
import { Card, Select } from "../components/ui";
import { ReadState } from "../components/PageState";
import { useResource } from "../lib/resources";
import { historicalFill, historicalStroke } from "../lib/ncr-colors";
import { loadNcr, number } from "../lib/evidence";
export function MetroHistory() {
  const resource = useResource("ncr-history-v2", loadNcr),
    [period, setPeriod] = useState("2020"),
    [mode, setMode] = useState("year"),
    [selected, setSelected] = useState("MANILA CITY");
  return (
    <div className="ui-container app-content evidence-page">
      <p className="eyebrow">METRO MANILA / HISTORICAL</p>
      <h1>A city-level historical comparison.</h1>
      <div className="evidence-banner" role="note">
        <strong>Data ends January 2021.</strong> No current NCR forecast is
        shown. Missing weeks are not zero.
      </div>
      <ReadState resource={resource}>
        {(data) => {
          const labels = [
            ...new Set(data.rows.map((r) => r.week_ending)),
          ].sort();
          const calendar: string[] = [];
          for (
            let time = Date.parse(labels[0] + "T00:00:00Z");
            time <= Date.parse(labels.at(-1)! + "T00:00:00Z");
            time += 7 * 86400000
          )
            calendar.push(new Date(time).toISOString().slice(0, 10));
          const periods =
            mode === "year"
              ? [...new Set(labels.map((date) => date.slice(0, 4)))]
              : calendar;
          const current = periods.includes(period) ? period : periods.at(-1)!;
          const rows = data.populations
            .map((pop) => {
              const values = data.rows.filter(
                (r) =>
                  r.city === pop.city &&
                  (mode === "year"
                    ? r.week_ending.startsWith(current)
                    : r.week_ending === current),
              );
              return {
                ...pop,
                n: values.length,
                cases: values.length
                  ? values.reduce((s, r) => s + r.cases, 0)
                  : null,
                rate: values.length
                  ? (values.reduce((s, r) => s + r.cases, 0) /
                      pop.population_2020) *
                    100000
                  : null,
              };
            })
            .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
          const max = Math.max(1, ...rows.map((r) => r.rate ?? 0));
          const row = rows.find((r) => r.city === selected)!;
          return (
            <>
              <div className="evidence-filters">
                <Select
                  label="Comparison period"
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value);
                    setPeriod(
                      e.target.value === "year" ? "2020" : "2021-01-10",
                    );
                  }}
                >
                  <option value="year">Year totals (available weeks)</option>
                  <option value="week">One source week</option>
                </Select>
                <Select
                  label={mode === "year" ? "Historical year" : "Week label"}
                  value={current}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  {periods.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
              </div>
              <p>
                <strong>
                  Population denominator unverified; confirm against PSA 2020
                  census.
                </strong>{" "}
                All rates use the same supplied 2020 denominator, including
                earlier years. No district or barangay case counts are inferred.
              </p>
              <Card>
                <h2>Recorded incidence per 100,000</h2>
                <p>
                  Darker blue means a larger historical rate in this selection.
                  It does not identify current risk. Gray means no source
                  observation, not zero. Exact values appear in the ranking
                  table.
                </p>
                <svg
                  className="ncr-city-map"
                  viewBox="0 0 720 520"
                  role="group"
                  aria-label="17 NCR city and municipal boundaries"
                >
                  {data.shapes.map((shape) => {
                    const r = rows.find((r) => r.city === shape.city)!,
                      fraction = r.rate === null ? null : r.rate / max,
                      fill = historicalFill(fraction);
                    return (
                      <path
                        key={shape.city}
                        d={shape.path}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selected === shape.city}
                        aria-label={`${shape.city}: ${r.rate === null ? "No observation" : number(r.rate) + " per 100,000"}`}
                        fill={fill}
                        stroke={historicalStroke(fill)}
                        strokeWidth={selected === shape.city ? 3 : 1.2}
                        onClick={() => setSelected(shape.city)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(shape.city);
                          }
                        }}
                      >
                        <title>
                          {shape.city} ·{" "}
                          {r.rate === null
                            ? "No observation"
                            : number(r.rate) + " per 100,000"}
                        </title>
                      </path>
                    );
                  })}
                </svg>
                <p className="evidence-selection" aria-live="polite">
                  <strong>{selected}</strong>:{" "}
                  {row.cases === null
                    ? "No data for this label"
                    : `${number(row.cases, 0)} recorded cases; ${number(row.rate)} per 100,000; ${row.n} source week(s).`}
                </p>
                <p className="muted">
                  Cases: DOH EPI, {current}; as of 2021-01-10. Boundaries:
                  NAMRIA/PSA via OCHA HDX, {data.boundary_source.license}, valid{" "}
                  {data.boundary_source.validOn}; not proven historical
                  boundaries.{" "}
                  <a className="text-link" href={data.boundary_source.url}>
                    Boundary source
                  </a>
                  .
                </p>
              </Card>
              <Card>
                <h2>City ranking · {current}</h2>
                <div
                  className="table-scroll"
                  role="region"
                  aria-label="Historical NCR city ranking"
                  tabIndex={0}
                >
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">City / municipality</th>
                        <th scope="col">Recorded cases</th>
                        <th scope="col">Per 100,000</th>
                        <th scope="col">Source weeks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.city}>
                          <th scope="row">
                            <button
                              type="button"
                              className="text-link"
                              onClick={() => setSelected(r.city)}
                            >
                              {r.city}
                            </button>
                          </th>
                          <td>{number(r.cases, 0)}</td>
                          <td>{number(r.rate)}</td>
                          <td>{r.n || "No observation"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="muted">
                  DOH EPI weekly source, ending January 2021. 2021 is January
                  only. Calendar gaps and partial years make totals incomplete.
                </p>
              </Card>
            </>
          );
        }}
      </ReadState>
    </div>
  );
}
