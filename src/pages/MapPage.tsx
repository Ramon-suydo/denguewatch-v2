import { lazy, Suspense, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { isSnapshotMode, snapshotDate, subscribeSnapshot } from "../lib/demo-snapshot";
import { CityGrid } from "../components/CityGrid";
import { Card, Select, Button } from "../components/ui";
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
  const { cities, forecasts, community, risks } = useAppData();
  useSyncExternalStore(subscribeSnapshot, snapshotDate, () => null);
  const offline = isSnapshotMode();
  const [mode, setMode] = useState("current");
  const [requestedView, setView] = useState(() =>
    window.matchMedia("(max-width: 767px)").matches ? "grid" : "map",
  );
  const view = offline ? "grid" : requestedView;
  const sort = "risk";
  return (
    <>
      <PageHeader
        eyebrow="MANILA HISTORICAL CONTEXT"
        title="Manila, in context."
        description="Manila city-level history, never patient locations. The Tondo barangay map follows the verified geography build."
      />
      <div className="ui-container app-content">
        <div className="badge-row" role="group" aria-label="City view">
          <Button
            variant={view === "map" ? "primary" : "secondary"}
            aria-pressed={view === "map"}
            disabled={offline}
            onClick={() => setView("map")}
          >
            Map
          </Button>
          <Button
            variant={view === "grid" ? "primary" : "secondary"}
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            Grid
          </Button>
        </div>
        {offline && <p className="muted">Offline demo uses the city grid; external map tiles are unavailable.</p>}
        <div className="section-heading">
          <p className="data-notice">
            This is the legacy monthly/historical risk display, separate from
            weekly case forecasts. Historical observations do not establish present-day risk. Gray
            markers mean current data is insufficient.
          </p>
          <Select
            label="Map risk display"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            <option value="current">Current risk</option>
            <option value="historical">Latest historical monthly model signal</option>
          </Select>
        </div>
        {mode === "historical" && (
          <p className="data-notice">
            You are viewing dated historical monthly signals, not current risk. Open a
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
                    {view === "grid" ? (
                      <ReadState resource={risks}>
                        {(records) => (
                          <>
                            <p className="muted">
                              Manila monthly counts and its separate daily series
                              are not added together. Barangay counts and boundaries
                              are not supplied in this phase.
                            </p>
                            <CityGrid
                              cities={list}
                              forecasts={estimates}
                              risks={records}
                              community={community.data}
                              historical={mode === "historical"}
                              sort={sort}
                              communityLoading={community.loading}
                              communityError={community.error}
                            />
                          </>
                        )}
                      </ReadState>
                    ) : (
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
                          Markers represent approximate city centers, not
                          boundaries or household locations. Map tiles load from
                          OpenStreetMap; no report content is sent to it.
                        </p>
                      </>
                    )}
                    {view === "map" && (
                      <>
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
                                      <td>
                                        {formatDate(forecast?.forecast_for)}
                                      </td>
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
