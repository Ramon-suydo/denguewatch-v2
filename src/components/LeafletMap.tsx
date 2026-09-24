import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "./ui";
import { RiskBadge } from "./RiskBadge";
import { UnverifiedBadge } from "./UnverifiedBadge";
import { CITY_CENTERS } from "../lib/map-centers";
import type { City, CommunityWeek, Forecast, ModelRisk } from "../lib/types";
import { currentRisk } from "../lib/forecast";
import { communityTotal, NO_COMMUNITY } from "./CommunitySection";
import { formatDate } from "../lib/dates";
import { colors } from "../theme/palette.js";
const fill: Record<ModelRisk, string> = {
  Low: colors.risk.low.ink,
  Medium: colors.risk.moderate.ink,
  High: colors.risk.high.ink,
  "Insufficient data": colors.risk.insufficient.ink,
};
export function LeafletMap({
  cities,
  forecasts,
  community,
  historical,
}: {
  cities: City[];
  forecasts: Forecast[];
  community: CommunityWeek[] | null;
  historical: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!container.current) return;
    setFailed(false);
    setLoading(true);
    const map = L.map(container.current, { scrollWheelZoom: false }).setView(
      [14.595, 121.025],
      11,
    );
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    );
    tiles.on("load", () => setLoading(false));
    tiles.on("tileerror", () => {
      setFailed(true);
      setLoading(false);
    });
    tiles.addTo(map);
    const roots: Root[] = [];
    for (const city of cities) {
      const position = CITY_CENTERS[city.name];
      if (!position) continue;
      const forecast = forecasts.find((row) => row.lgu_id === city.id);
      const level = historical
        ? (forecast?.risk_label ?? "Insufficient data")
        : currentRisk(forecast);
      const symbol = document.createElement("span");
      symbol.className = "map-city-dot";
      symbol.style.backgroundColor = fill[level];
      symbol.textContent =
        level === "Low"
          ? "L"
          : level === "Medium"
            ? "M"
            : level === "High"
              ? "H"
              : "?";
      const icon = L.divIcon({
        html: symbol,
        className: "map-marker",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const marker = L.marker(position, {
        icon,
        title: city.name + ": " + level,
        alt: city.name + ": " + level,
        keyboard: true,
      }).addTo(map);
      const popup = document.createElement("div");
      const root = createRoot(popup);
      roots.push(root);
      const count = community ? communityTotal(community, city.id) : null;
      root.render(
        <div className="city-popup">
          <h3>{city.name}</h3>
          <p>{historical ? "Historical signal" : "Current risk"}</p>
          <RiskBadge level={level} />
          {forecast && (
            <>
              <p>Estimate for {formatDate(forecast.forecast_for)}.</p>
              <p>
                <strong>Recent eligible historical months</strong>
              </p>
              {forecast.input_periods.length ? (
                <ul>
                  {forecast.input_periods.map((row) => (
                    <li key={row.date}>
                      {formatDate(row.date)}: {row.cases} cases
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No complete-period trend available.</p>
              )}
            </>
          )}
          <hr />
          <UnverifiedBadge />
          <p>
            {!community
              ? "Community counts are unavailable."
              : count === null
                ? NO_COMMUNITY
                : count +
                  " reports in publishable weeks (current + seven prior weeks). Smaller groups are hidden."}
          </p>
          <a className="text-link" href={"/city/" + city.id}>
            Open city detail ↗
          </a>
        </div>,
      );
      marker.bindPopup(popup, { maxWidth: 330, minWidth: 240 });
    }
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.remove();
      queueMicrotask(() => roots.forEach((root) => root.unmount()));
    };
  }, [cities, forecasts, community, historical, attempt]);
  return (
    <>
      <div
        className="map-container"
        ref={container}
        aria-label="NCR city risk map"
      />
      {loading && <p role="status">Loading OpenStreetMap tiles…</p>}
      {failed && (
        <div className="data-notice" role="status">
          <p>
            Some map tiles could not load. City markers and the accessible list
            below remain available.
          </p>
          <Button
            variant="secondary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry map tiles
          </Button>
        </div>
      )}
    </>
  );
}
