import { lazy, Suspense, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  LayoutShell,
  Modal,
  MonitoringLine,
  Reveal,
  Select,
  useToast,
} from "../components/ui";
import { RiskBadge, type RiskLevel } from "../components/RiskBadge";
import { UnverifiedBadge } from "../components/UnverifiedBadge";
import { StatCard } from "../components/StatCard";
const TrendChart = lazy(() =>
  import("../components/TrendChart").then((module) => ({
    default: module.TrendChart,
  })),
);

const weekly = [
  { week: "Aug 03", cases: 14, previous: 19 },
  { week: "Aug 10", cases: 18, previous: 22 },
  { week: "Aug 17", cases: 16, previous: 20 },
  { week: "Aug 24", cases: 25, previous: 29 },
  { week: "Aug 31", cases: 21, previous: 27 },
  { week: "Sep 07", cases: 17, previous: 24 },
  { week: "Sep 14", cases: 15, previous: 20 },
  { week: "Sep 21", cases: 12, previous: 18 },
];
const areas: { name: string; cases: number | null; level: RiskLevel }[] = [
  { name: "Sample area A", cases: 4, level: "Low" },
  { name: "Sample area B", cases: 11, level: "Moderate" },
  { name: "Sample area C", cases: 18, level: "High" },
  { name: "Sample area D", cases: null, level: "Insufficient data" },
];
export function DesignPreview() {
  const [period, setPeriod] = useState("8");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const toast = useToast();
  const points = weekly.slice(-Number(period));
  const total = points.reduce((sum, point) => sum + point.cases, 0);
  const previous = points.reduce((sum, point) => sum + point.previous, 0);
  const decrease = Math.round((1 - total / previous) * 100);
  const visibleAreas = areas.filter((area) =>
    area.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <LayoutShell
      items={[
        { label: "Overview", href: "#overview", active: true },
        { label: "Area snapshot", href: "#areas" },
        { label: "Design guide", href: "#design-guide" },
      ]}
      action={
        <Button
          onClick={() => {
            setConsent(false);
            setModalOpen(true);
          }}
        >
          Try report flow <span aria-hidden="true">↗</span>
        </Button>
      }
    >
      <section className="overview-hero" id="overview">
        <div className="dw-container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" /> COMMUNITY HEALTH MONITORING
            </div>
            <h1>
              A clearer view.
              <br />
              <em>A healthier community.</em>
            </h1>
            <p>
              Local signals, thoughtfully connected.
              <br />
              Understand trends. Keep your community in focus.
            </p>
          </div>
          <div className="hero-aside">
            <MonitoringLine className="hero-monitor" />
            <div className="hero-note">
              <span className="hero-note-label">THE BIG PICTURE</span>
              <p>
                Better awareness starts
                <br />
                with information you can trust.
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="dw-container preview-content">
        <div className="preview-notice">
          <Badge>Design preview</Badge>
          <p>
            All figures, sources, and risk levels below are illustrative. No
            live health data.
          </p>
        </div>
        <section aria-labelledby="snapshot-title">
          <div className="section-heading snapshot-heading">
            <div>
              <p className="eyebrow text-teal-600">SITUATION AT A GLANCE</p>
              <h2 id="snapshot-title">Community overview</h2>
              <p className="muted">
                Sample reporting window · ending 21 September 2026
              </p>
            </div>
            <Select
              label="Reporting period"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option value="8">Last 8 weeks</option>
              <option value="4">Last 4 weeks</option>
            </Select>
          </div>
          <div className="stat-grid">
            <StatCard
              label="Reported cases"
              value={String(total)}
              detail={`Across the selected ${period} weeks`}
              annotation={<UnverifiedBadge source="official" />}
            />
            <StatCard
              label="Change from prior period"
              value={`−${decrease}%`}
              detail={`${previous} cases in the comparison period`}
              annotation={
                <span className="stat-context">↓ Fewer reported cases</span>
              }
            />
            <StatCard
              label="Areas in this preview"
              value="04"
              detail="Illustrating all four risk states"
              annotation={<Badge>Sample coverage</Badge>}
            />
            <StatCard
              label="Community reports"
              value="07"
              detail="Separate from official case totals"
              annotation={<UnverifiedBadge />}
            />
          </div>
        </section>
        <Reveal>
          <div className="insights-grid">
            <Card className="trend-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PATTERNS OVER TIME</p>
                  <h2>Weekly case trend</h2>
                </div>
                <Badge>{period}-week view</Badge>
              </div>
              <Suspense
                fallback={
                  <p className="empty-state" role="status">
                    Loading chart…
                  </p>
                }
              >
                <TrendChart data={points} />
              </Suspense>
              <p className="panel-footnote">
                Illustrative counts, not a forecast. Missing observations stay
                as gaps.
              </p>
            </Card>
            <Card className="reading-panel">
              <span className="section-number">01 / READING THE SIGNALS</span>
              <h2>
                Context before
                <br />
                conclusions.
              </h2>
              <p>
                A risk level and a report’s source answer different questions.
                Read them together.
              </p>
              <div className="reading-item">
                <RiskBadge level="Moderate" />
                <p>Risk describes an area’s situation.</p>
              </div>
              <div className="reading-item">
                <UnverifiedBadge />
                <p>
                  Source describes where a report came from. Unverified does not
                  mean high risk.
                </p>
              </div>
              <a className="text-link" href="#design-guide">
                Explore the visual guide <span aria-hidden="true">↗</span>
              </a>
            </Card>
          </div>
        </Reveal>
        <Reveal>
          <section id="areas" aria-labelledby="areas-title">
            <div className="section-heading area-heading">
              <div>
                <p className="eyebrow">A CLOSER LOOK</p>
                <h2 id="areas-title">Area snapshot</h2>
                <p className="muted">
                  Example states only. These labels are not calculated from the
                  counts.
                </p>
              </div>
              <Input
                label="Find a sample area"
                type="search"
                placeholder="Search area name…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Card className="area-table">
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Area snapshot table"
              >
                <table>
                  <caption className="sr-only">
                    Illustrative area cases, risk levels and data sources
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Area</th>
                      <th scope="col">Sample cases</th>
                      <th scope="col">Risk level</th>
                      <th scope="col">Data source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAreas.map((area) => (
                      <tr key={area.name}>
                        <th scope="row">{area.name}</th>
                        <td className="case-count">{area.cases ?? "—"}</td>
                        <td>
                          <RiskBadge level={area.level} />
                        </td>
                        <td>
                          <UnverifiedBadge source="official" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!visibleAreas.length && (
                <p className="empty-state" role="status">
                  No sample areas match “{search}”.
                </p>
              )}
              <p className="table-note">
                “Insufficient data” is a distinct state. An absent count is
                never treated as zero.
              </p>
            </Card>
          </section>
        </Reveal>
        <Reveal>
          <section
            className="design-guide"
            id="design-guide"
            aria-labelledby="guide-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">THE DENGUEWATCH IDENTITY</p>
                <h2 id="guide-title">Calm by design. Clear by purpose.</h2>
              </div>
              <Badge>Identity v1</Badge>
            </div>
            <div className="guide-grid">
              <Card>
                <h3>A considered palette</h3>
                <div className="swatch-row">
                  <div>
                    <span className="swatch bg-teal-900" />
                    <strong>Deep Teal</strong>
                    <code>#103938</code>
                  </div>
                  <div>
                    <span className="swatch bg-signal-500" />
                    <strong>Signal Amber</strong>
                    <code>#E68A2E</code>
                  </div>
                  <div>
                    <span className="swatch bg-warm-100" />
                    <strong>Warm Gray</strong>
                    <code>#F2F0EB</code>
                  </div>
                </div>
                <p className="muted">
                  Teal anchors the interface. Burnt amber invites action. Warm
                  neutrals give the data breathing room.
                </p>
              </Card>
              <Card>
                <h3>Authority, with approachability</h3>
                <p className="type-specimen">Information that cares.</p>
                <p>
                  Source Serif 4 headings pair with Source Sans 3 for readable
                  labels, clear numbers, and an editorial voice.
                </p>
                <div className="button-specimens">
                  <Button
                    onClick={() =>
                      toast("Primary button preview. No report was submitted.")
                    }
                  >
                    Primary action
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => toast("Secondary button preview.")}
                  >
                    Secondary
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => toast("Ghost button preview.")}
                  >
                    Ghost action ↗
                  </Button>
                </div>
              </Card>
            </div>
            <Card className="badge-guide">
              <div>
                <h3>Risk level only</h3>
                <div className="badge-row">
                  {(
                    ["Low", "Moderate", "High", "Insufficient data"] as const
                  ).map((level) => (
                    <RiskBadge key={level} level={level} />
                  ))}
                </div>
              </div>
              <div>
                <h3>Data source only</h3>
                <div className="badge-row">
                  <UnverifiedBadge />
                  <UnverifiedBadge source="official" />
                </div>
              </div>
            </Card>
          </section>
        </Reveal>
      </div>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="A thoughtful first step"
      >
        <p className="muted">
          This previews the consent controls for a future reporting flow. No
          personal information is collected or saved.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setModalOpen(false);
            toast("Preview complete. No report or consent was saved.");
          }}
        >
          <Checkbox
            label="I understand this is a design preview and no report will be submitted."
            required
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!consent}>
              Continue preview
            </Button>
          </div>
        </form>
      </Modal>
    </LayoutShell>
  );
}
