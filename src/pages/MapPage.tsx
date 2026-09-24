import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Select } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { Loading, ReadState } from "../components/PageState";
import { useAppData } from "../lib/resources";
import { RiskBadge } from "../components/RiskBadge";
import { currentRisk } from "../lib/forecast";
import { formatDate } from "../lib/dates";
import { communityTotal } from "../components/CommunitySection";
import { UnverifiedBadge } from "../components/UnverifiedBadge";
const LeafletMap = lazy(() =>
  import("../components/LeafletMap").then((module) => ({
    default: module.LeafletMap,
  })),
);
export function MapPage() {
  const { cities, forecasts, community } = useAppData();
  const [mode, setMode] = useState("current");
  return (
    <>
      <PageHeader
        eyebrow="NCR AT A GLANCE"
        title="Place the signals in context."
        description="City-level markers, never patient locations. Explore a city to inspect its data and explanation."
      />
      <div className="dw-container app-content">
        <div className="section-heading">
          <p className="data-notice">
            Historical observations do not establish present-day risk. Gray
            markers mean current data is insufficient.
          </p>
          <Select
            label="Map risk display"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            <option value="current">Current risk</option>
            <option value="historical">Latest historical model signal</option>
          </Select>
        </div>
        {mode === "historical" && (
          <p className="data-notice">
            You are viewing dated historical signals, not current risk. Open a
            marker for its forecast month.
          </p>
        )}
        <div className="badge-row map-legend" aria-label="Risk legend">
          {(["Low", "Medium", "High", "Insufficient data"] as const).map(
            (level) => (
              <RiskBadge key={level} level={level} />
            ),
          )}
        </div>
        <ReadState resource={cities}>
          {(list) =>
            !list.length ? (
              <Card>No cities are available to map.</Card>
            ) : (
              <ReadState resource={forecasts}>
                {(estimates) => (
                  <>
                    <Card className="map-card">
                      <Suspense fallback={<Loading label="Loading map…" />}>
                        <LeafletMap
                          cities={list}
                          forecasts={estimates}
                          community={community.data}
                          historical={mode === "historical"}
                        />
                      </Suspense>
                    </Card>
                    <p className="muted">
                      Markers represent approximate city centers, not boundaries
                      or household locations. Map tiles load from OpenStreetMap;
                      no report content is sent to it.
                    </p>
                    <h2>Accessible city list</h2>
                    <Card className="area-table">
                      <div
                        className="table-scroll"
                        tabIndex={0}
                        role="region"
                        aria-label="Map city list"
                      >
                        <table>
                          <thead>
                            <tr>
                              <th scope="col">City</th>
                              <th scope="col">
                                {mode === "historical"
                                  ? "Historical signal"
                                  : "Current risk"}
                              </th>
                              <th scope="col">Forecast for</th>
                              <th scope="col">
                                <UnverifiedBadge />
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((city) => {
                              const forecast = estimates.find(
                                (row) => row.lgu_id === city.id,
                              );
                              const count = community.data
                                ? communityTotal(community.data, city.id)
                                : null;
                              return (
                                <tr key={city.id}>
                                  <th scope="row">
                                    <Link to={"/city/" + city.id}>
                                      {city.name}
                                    </Link>
                                  </th>
                                  <td>
                                    <RiskBadge
                                      level={
                                        mode === "historical"
                                          ? (forecast?.risk_label ??
                                            "Insufficient data")
                                          : currentRisk(forecast)
                                      }
                                    />
                                  </td>
                                  <td>{formatDate(forecast?.forecast_for)}</td>
                                  <td>
                                    {community.loading
                                      ? "Loading…"
                                      : community.error
                                        ? "Unavailable"
                                        : count === null
                                          ? "No public count (zero or suppressed)"
                                          : count + " in publishable weeks"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </>
                )}
              </ReadState>
            )
          }
        </ReadState>
        {community.error && (
          <p className="data-notice">
            Community counts could not load.{" "}
            <button className="text-link" onClick={community.retry}>
              Retry community counts
            </button>
          </p>
        )}
      </div>
    </>
  );
}
