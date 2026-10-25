import { ReportingStatus } from "../components/ReportingStatus";
import { Card } from "../components/ui";
import { ReadState } from "../components/PageState";
import { useResource } from "../lib/resources";
import { signalAggregates } from "../lib/signals";
export function CommunityReports() {
  const reports = useResource("community-v2", signalAggregates);
  return (
    <div className="ui-container app-content evidence-page">
      <p className="eyebrow">COMMUNITY / UNVERIFIED</p>
      <h1>Community reports, kept separate.</h1>
      <Card>
        <p>
          <ReportingStatus /> These are community-reported, unverified
          awareness signals, never official dengue counts or forecast inputs.
          Staff approval is a content review, not medical verification.
        </p>
        <p>
          Publication requires at least three approved reports per area/week and
          a minimum 72-hour delay. Missing or suppressed groups do not mean zero
          cases. There is no validation history establishing predictive value.
        </p>
      </Card>
      <ReadState resource={reports}>
        {(rows) => (
          <Card>
            <h2>Published community aggregates</h2>
            {!rows.length ? (
              <p>
                No publishable groups. Reports may be absent, awaiting review,
                delayed or suppressed; no count is inferred.
              </p>
            ) : (
              <div
                className="table-scroll"
                role="region"
                aria-label="Unverified community aggregates"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Coarse area</th>
                      <th scope="col">Onset week</th>
                      <th scope="col">Unverified reports (lower bound)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.area_label + r.week_start}>
                        <th scope="row">{r.area_label}</th>
                        <td>{r.week_start}</td>
                        <td>{r.report_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="muted">
              Source: voluntary community reports, delayed and moderated;
              displayed onset weeks are historical, not official diagnoses.
            </p>
          </Card>
        )}
      </ReadState>
    </div>
  );
}
