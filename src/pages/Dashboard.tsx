import { Link } from "react-router-dom";
import { Card } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { ReadState } from "../components/PageState";
import { HistoricalExplorer } from "../components/HistoricalExplorer";
import { CommunitySection } from "../components/CommunitySection";
import { ForecastPanel } from "../components/ForecastPanel";
import { RiskBadge } from "../components/RiskBadge";
import { UnverifiedBadge } from "../components/UnverifiedBadge";
import { useAppData } from "../lib/resources";
import { currentRisk } from "../lib/forecast";
import { formatDate } from "../lib/dates";
export function Dashboard() {
  const { cities, forecasts } = useAppData();
  return (
    <>
      <PageHeader
        eyebrow="PUBLIC SITUATIONAL AWARENESS"
        title="Manila dengue history, in focus."
        description="Explore Manila’s published dengue history. Community reports remain separate and collection is closed."
      />
      <div className="ui-container app-content">
        <ReadState resource={cities}>
          {(list) => {
            if (!list.length)
              return (
                <Card>
                  <h2>No cities available yet</h2>
                  <p>Published data has not been loaded.</p>
                </Card>
              );
            const city = list[0];
            return (
              <>
                <div className="section-heading city-selector">
                  <div>
                    <UnverifiedBadge source="official" />
                    <p className="muted">
                      Published source data · historical, not live
                    </p>
                  </div>

                </div>
                <HistoricalExplorer key={city.id} city={city} />
                <div className="section-heading detail-link">
                  <Link className="text-link" to={"/city/" + city.id}>
                    Explore {city.name} in detail ↗
                  </Link>
                </div>
                <ForecastPanel cityName={city.name} />
                <section aria-labelledby="risk-title">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">MANILA HISTORICAL CONTEXT</p>
                      <h2 id="risk-title">Manila monthly historical context</h2>
                    </div>
                    <Link className="text-link" to="/map">
                      Explore the map ↗
                    </Link>
                  </div>
                  <p className="muted">
                    This separate legacy display uses monthly historical
                    thresholds, not the weekly forecasting model. Current risk
                    is insufficient when the saved forecast month
                    has expired. A historical signal is not a current warning
                    level.
                  </p>
                  <ReadState resource={forecasts}>
                    {(rows) => (
                      <Card className="area-table">
                        <div
                          className="table-scroll"
                          role="region"
                          aria-label="City risk levels"
                          tabIndex={0}
                        >
                          <table>
                            <thead>
                              <tr>
                                <th scope="col">City / municipality</th>
                                <th scope="col">Current evidence</th>
                                <th scope="col">Historical signal</th>
                                <th scope="col">Forecast for</th>
                              </tr>
                            </thead>
                            <tbody>
                              {list.map((item) => {
                                const forecast = rows.find(
                                  (row) => row.lgu_id === item.id,
                                );
                                return (
                                  <tr key={item.id}>
                                    <th scope="row">
                                      <Link to={"/city/" + item.id}>
                                        {item.name}
                                      </Link>
                                    </th>
                                    <td>
                                      <RiskBadge
                                        level={currentRisk(forecast)}
                                      />
                                    </td>
                                    <td>
                                      {forecast ? (
                                        <RiskBadge
                                          level={forecast.risk_label}
                                        />
                                      ) : (
                                        <span>Not computed</span>
                                      )}
                                    </td>
                                    <td>
                                      {formatDate(forecast?.forecast_for)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}
                  </ReadState>
                </section>
                <CommunitySection city={city.id} />
              </>
            );
          }}
        </ReadState>
      </div>
    </>
  );
}
