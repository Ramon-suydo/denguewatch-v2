import { Link } from "react-router-dom";
import { Card } from "./ui";
import { RiskBadge } from "./RiskBadge";
import { UnverifiedBadge } from "./UnverifiedBadge";
import { communityTotal, NO_COMMUNITY } from "./CommunitySection";
import { currentRisk } from "../lib/forecast";
import { formatDate } from "../lib/dates";
import type { City, Forecast, CommunityWeek } from "../lib/types";
import type { riskInputs } from "../lib/composite";
export type RiskRecord = {
  lgu_id: string;
  inputs: ReturnType<typeof riskInputs>;
};
export function CityGrid({
  cities,
  forecasts,
  risks,
  community,
  historical,
  sort,
  communityLoading,
  communityError,
}: {
  cities: City[];
  forecasts: Forecast[];
  risks: RiskRecord[];
  community: CommunityWeek[] | null;
  historical: boolean;
  sort: string;
  communityLoading: boolean;
  communityError: string | null;
}) {
  const risk = (id: string) => {
    const f = forecasts.find((r) => r.lgu_id === id);
    return historical ? (f?.risk_label ?? "Insufficient data") : currentRisk(f);
  };
  const rank = { High: 0, Medium: 1, Low: 2, "Insufficient data": 3 };
  const latest = (id: string) =>
    risks.find((r) => r.lgu_id === id)?.inputs.latest ?? [];
  const sorted = [...cities].sort(
    (a, b) =>
      (sort === "cases"
        ? (latest(b.id).at(-1)?.cases ?? -1) -
          (latest(a.id).at(-1)?.cases ?? -1)
        : sort === "risk"
          ? rank[risk(a.id)] - rank[risk(b.id)]
          : 0) || a.name.localeCompare(b.name),
  );
  return (
    <div className="city-grid">
      {sorted.map((city) => {
        const points = latest(city.id),
          last = points.at(-1),
          previous = points.at(-2);
        const direction =
          last && previous
            ? last.cases > previous.cases
              ? "Up"
              : last.cases < previous.cases
                ? "Down"
                : "Flat"
            : null;
        const count = community ? communityTotal(community, city.id) : null;
        return (
          <Card key={city.id} className="city-grid-card">
            <h2>
              <Link to={"/city/" + city.id}>{city.name}</Link>
            </h2>
            <RiskBadge level={risk(city.id)} />
            <p>
              <strong className="city-case-count">
                {last?.cases.toLocaleString() ?? "Unavailable"}
              </strong>
              <br />
              Latest known monthly cases · {formatDate(last?.date)}
            </p>
            {direction ? (
              <p>
                {direction === "Up" ? "↑" : direction === "Down" ? "↓" : "→"}{" "}
                {direction} vs {formatDate(previous?.date)} (
                {previous?.cases.toLocaleString()})
              </p>
            ) : (
              <p>No previous period for comparison.</p>
            )}
            {last && (!last.complete || !previous?.complete) && (
              <p className="data-notice">
                Partial or flagged periods: raw count direction is not a
                comparable incidence trend.
              </p>
            )}
            <div className="city-community">
              <UnverifiedBadge />
              <p>
                {communityLoading
                  ? "Loading community counts…"
                  : communityError
                    ? "Community counts unavailable."
                    : count === null
                      ? NO_COMMUNITY
                      : count +
                        " reports in publishable weeks (last eight weeks; a lower bound)."}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
