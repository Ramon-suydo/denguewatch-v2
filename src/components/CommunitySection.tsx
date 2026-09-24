import { Card } from "./ui";
import { UnverifiedBadge } from "./UnverifiedBadge";
import { ReadState } from "./PageState";
import { useAppData } from "../lib/resources";
import { formatDate, recentMonday } from "../lib/dates";
import type { CommunityWeek } from "../lib/types";
export function communityTotal(
  rows: CommunityWeek[],
  city: string,
): number | null {
  const found = rows.filter((row) => row.lgu_id === city);
  return found.length
    ? found.reduce((sum, row) => sum + Number(row.report_count), 0)
    : null;
}
export const NO_COMMUNITY =
  "No community reports yet for this city, or fewer than five in each week. Small counts are hidden for privacy.";
export function CommunitySection({ city }: { city: string }) {
  const { community } = useAppData();
  return (
    <section className="community-section" aria-labelledby="community-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">A SEPARATE COMMUNITY SIGNAL</p>
          <h2 id="community-title">Recent community reports</h2>
        </div>
        <UnverifiedBadge />
      </div>
      <p className="muted">
        Current week and seven previous weeks, from {formatDate(recentMonday())}
        . Self-reports are not verified cases and are never added to official
        totals or forecasts.
      </p>
      <ReadState resource={community}>
        {(rows) => {
          const visible = rows.filter((row) => row.lgu_id === city);
          return (
            <Card>
              {visible.length ? (
                <>
                  <p>
                    <strong>{communityTotal(rows, city)}</strong> reports in
                    publishable weeks. This is a lower bound, not an exact
                    total.
                  </p>
                  <div
                    className="table-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label="Community report counts"
                  >
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Week starting</th>
                          <th scope="col">Community reports</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((row) => (
                          <tr key={row.week_start}>
                            <th scope="row">{formatDate(row.week_start)}</th>
                            <td>{row.report_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="empty-state">{NO_COMMUNITY}</p>
              )}
              <p className="panel-footnote">
                Only city/week groups of at least five active, unexpired reports
                are published. Missing weeks are not zero.
              </p>
            </Card>
          );
        }}
      </ReadState>
    </section>
  );
}
