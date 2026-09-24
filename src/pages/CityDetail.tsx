import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { ReadState } from "../components/PageState";
import { HistoricalExplorer } from "../components/HistoricalExplorer";
import { ForecastPanel } from "../components/ForecastPanel";
import { CommunitySection } from "../components/CommunitySection";
import { useAppData } from "../lib/resources";
export function CityDetail() {
  const { id } = useParams();
  const { cities, forecasts } = useAppData();
  return (
    <>
      <PageHeader
        eyebrow="CITY DETAIL"
        title={
          cities.data?.find((city) => city.id === id)?.name ?? "City history"
        }
        description="Inspect full source series, incidence, and the reasoning behind the saved historical estimate."
      />
      <div className="dw-container app-content">
        <Link className="text-link" to="/">
          ← All NCR cities
        </Link>
        <ReadState resource={cities}>
          {(list) => {
            const city = list.find((item) => item.id === id);
            if (!city)
              return (
                <Card>
                  <h2>City not found</h2>
                  <p>
                    This link does not match an active NCR city. Choose one from
                    the dashboard.
                  </p>
                </Card>
              );
            return (
              <>
                <p className="data-notice">
                  Monthly records cover January 2016–January 2021, not all of
                  2021.{" "}
                  {city.name === "MANILA CITY"
                    ? "Manila also has a separate daily series for 2018–2 December 2023. Missing dates remain gaps."
                    : "Daily observations are not supplied for this city."}
                </p>
                <HistoricalExplorer key={city.id} city={city} detail />
                <ReadState resource={forecasts}>
                  {(rows) => (
                    <ForecastPanel
                      forecast={rows.find((row) => row.lgu_id === city.id)}
                    />
                  )}
                </ReadState>
                <CommunitySection city={city.id} />
              </>
            );
          }}
        </ReadState>
      </div>
    </>
  );
}
