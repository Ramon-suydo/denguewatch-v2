import { lazy, Suspense, useState } from "react";
import { Card, Select } from "./ui";
import { Loading, ReadState } from "./PageState";
import { useResource } from "../lib/resources";
import { fetchHistory } from "../lib/api";
import type { City, PeriodType } from "../lib/types";
const HistoryChart = lazy(() =>
  import("./HistoryChart").then((module) => ({ default: module.HistoryChart })),
);
export function HistoricalExplorer({
  city,
  detail = false,
}: {
  city: City;
  detail?: boolean;
}) {
  const [period, setPeriod] = useState<PeriodType>("month");
  const history = useResource(city.id + ":" + period, (signal) =>
    fetchHistory(city.id, period, signal),
  );
  return (
    <section aria-labelledby="history-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PUBLISHED SURVEILLANCE</p>
          <h2 id="history-title">
            {detail ? "Full historical series" : "Historical case trend"}
          </h2>
        </div>
        <Select
          label="Period type"
          value={period}
          onChange={(event) => setPeriod(event.target.value as PeriodType)}
        >
          <option value="month">Monthly · NCR</option>
          <option value="week">Weekly · NCR</option>
          <option value="day">Daily · Manila only</option>
        </Select>
      </div>
      <ReadState resource={history}>
        {(rows) => (
          <div className="content-stack">
            <Card>
              <Suspense fallback={<div className="history-chart chart-skeleton" role="status">Loading chart…</div>}>
                <HistoryChart rows={rows} period={period} />
              </Suspense>
            </Card>
            {detail && (
              <Card>
                <h2>Incidence over time</h2>
                <p className="muted">
                  Rates are source-supplied cases per 100,000 residents. Missing
                  rates are not estimated from a current population.
                </p>
                <Suspense
                  fallback={<div className="history-chart chart-skeleton" role="status">Loading incidence chart…</div>}
                >
                  <HistoryChart
                    rows={rows}
                    period={period}
                    metric="incidence"
                  />
                </Suspense>
              </Card>
            )}
          </div>
        )}
      </ReadState>
    </section>
  );
}
