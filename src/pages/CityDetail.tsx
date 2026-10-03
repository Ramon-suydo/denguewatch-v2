import { useEffect } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Card } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { ReadState } from "../components/PageState";
import { HistoricalExplorer } from "../components/HistoricalExplorer";
import { ForecastPanel } from "../components/ForecastPanel";
import { CommunitySection } from "../components/CommunitySection";
import { useAppData } from "../lib/resources";
import { LguPrintReport } from "../components/LguPrintReport";
export function CityDetail() {
  const { id } = useParams();
  const { cities } = useAppData();
  const location = useLocation();
  useEffect(() => { if (location.hash === "#model-transparency-title") { const frame = requestAnimationFrame(() => document.getElementById("model-transparency-title")?.scrollIntoView()); return () => cancelAnimationFrame(frame); } }, [location.hash, cities.data]);
  return (
    <>
      <PageHeader
        eyebrow="CITY DETAIL"
        title={
          cities.data?.find((city) => city.id === id)?.name ?? "City history"
        }
        description="Inspect full source series, incidence, and weekly forecast estimates and their backtest performance."
      />
      <div className="ui-container app-content city-report-page">
        <Link className="text-link" to="/">
          ← Manila overview
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
                <LguPrintReport key={city.id} city={city} />
                <div className="screen-only content-stack">
                <p className="data-notice">
                  Monthly records cover January 2016–January 2021, not all of
                  2021.{" "}
                  {city.name === "MANILA CITY"
                    ? "Manila also has a separate daily series for 2018–2 December 2023. Missing dates remain gaps."
                    : "Daily observations are not supplied for this city."}
                </p>
                <HistoricalExplorer key={city.id} city={city} detail />
                <ForecastPanel cityName={city.name} />
                <CommunitySection city={city.id} />
                </div>
              </>
            );
          }}
        </ReadState>
      </div>
    </>
  );
}
