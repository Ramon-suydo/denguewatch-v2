import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Select } from "../components/ui";
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
  const [selected, setSelected] = useState("");
  return (
    <>
      <PageHeader
        eyebrow="PUBLIC SITUATIONAL AWARENESS"
        title="Community health, in focus."
        description="Explore NCR’s published dengue history and clearly separated community signals. No account required."
      />
      <div className="dw-container app-content">
        <p className="data-notice">
          Historical coverage: NCR monthly/weekly 2016–January 2021; Manila
          daily 2018–2 December 2023. These records do not establish current
          dengue conditions.
        </p>
        <ReadState resource={cities}>
          {(list) => {
            if (!list.length)
              return (
                <Card>
                  <h2>No cities available yet</h2>
                  <p>Published data has not been loaded.</p>
                </Card>
              );
            const city =
              list.find((item) => item.id === selected) ??
              list.find((item) => item.name === "MANILA CITY") ??
              list[0];
            return (
              <>
                <div className="section-heading city-selector">
                  <div>
                    <UnverifiedBadge source="official" />
                    <p className="muted">
                      Published source data · historical, not live
                    </p>
                  </div>
                  <Select
                    label="Choose an NCR city / municipality"
                    value={city.id}
                    onChange={(event) => setSelected(event.target.value)}
                  >
                    {list.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <HistoricalExplorer key={city.id} city={city} />
                <div className="section-heading detail-link">
                  <Link className="text-link" to={"/city/" + city.id}>
                    Explore {city.name} in detail ↗
                  </Link>
                </div>
                <ReadState resource={forecasts}>
                  {(rows) => (
                    <ForecastPanel
                      forecast={rows.find((row) => row.lgu_id === city.id)}
                    />
                  )}
                </ReadState>
                <section aria-labelledby="risk-title">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">ACROSS THE REGION</p>
                      <h2 id="risk-title">City risk overview</h2>
                    </div>
                    <Link className="text-link" to="/map">
                      Explore the map ↗
                    </Link>
                  </div>
                  <p className="muted">
                    Current risk is insufficient when the saved forecast month
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
                                <th scope="col">Current risk</th>
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
