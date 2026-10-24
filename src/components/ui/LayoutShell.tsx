import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { MonitoringLine } from "./MonitoringLine";
import { ConnectionNotice } from "../ConnectionNotice";
import { SnapshotNotice } from "../SnapshotNotice";
import { isSnapshotMode } from "../../lib/demo-snapshot";
import { SharedDisclaimer } from "../SharedDisclaimer";
import { fetchSourceCoverage } from "../../lib/api";
import { useResource } from "../../lib/resources";
import { formatDate } from "../../lib/dates";
import { sourceAttribution } from "../../lib/source-metadata";
export type NavItem = { label: string; href: string; active?: boolean };
export function TopNav({
  items,
  action,
}: {
  items: NavItem[];
  action?: ReactNode;
}) {
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      document.documentElement.style.setProperty(
        "--nav-height",
        `${element.getBoundingClientRect().height}px`,
      ),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 10);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <header
      ref={header}
      className={"top-nav" + (scrolled ? " is-scrolled" : "")}
    >
      <div className="ui-container nav-inner">
        <Link className="wordmark" to="/" aria-label="DengueWatch home">
          <span className="brand-symbol">
            <MonitoringLine />
          </span>
          <span>
            Dengue<span className="wordmark-light">Watch</span>
          </span>
        </Link>
        <Button
          className="menu-toggle"
          variant="ghost"
          aria-expanded={expanded}
          aria-controls="main-navigation"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Close menu" : "Menu"}
        </Button>
        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className={expanded ? "nav-links expanded" : "nav-links"}
          onClick={() => setExpanded(false)}
        >
          {items.map((item) =>
            item.href.startsWith("#") ? (
              <a
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                aria-current={item.active ? "page" : undefined}
              >
                {item.label}
              </Link>
            ),
          )}
          {action}
        </nav>
      </div>
      <div className="brand-rail" aria-hidden="true" />
    </header>
  );
}
export function LayoutShell({
  children,
  items,
  action,
  preview = false,
  research = false,
}: {
  children: ReactNode;
  items: NavItem[];
  action?: ReactNode;
  preview?: boolean;
  research?: boolean;
}) {
  const coverage = useResource<
    { source: string; period: string; label: string; date: string | null }[]
  >(
    research ? "bundled-source-coverage" : "source-coverage",
    research
      ? async () => [
          {
            source: "doh-epi-dengue-data-2016-2021.csv",
            period: "week",
            label: "DOH EPI weekly",
            date: "2021-01-10",
          },
          {
            source:
              "Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx",
            period: "day",
            label: "Manila daily workbook",
            date: "2023-12-02",
          },
        ]
      : fetchSourceCoverage,
  );
  const latest = coverage.data
    ?.filter((row) => row.date)
    .sort((a, b) => b.date!.localeCompare(a.date!))[0];
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="site-chrome" lang="en">
        <TopNav items={items} action={action} />
        <div className="honesty-strip">
          <div className="ui-container honesty-inner">
            <span>
              Historical estimates, not alerts. Bundled source periods.{" "}
              {coverage.loading
                ? "Checking data periods…"
                : coverage.error
                  ? "Data periods unavailable."
                  : "Data: " +
                    coverage.data
                      ?.filter(
                        (row) => row.period === "week" || row.period === "day",
                      )
                      .map((row) =>
                        row.date
                          ? `${new Date(row.date + "T00:00:00Z").toLocaleDateString("en-PH", { month: "short", year: "numeric", timeZone: "UTC" })} (${row.period === "week" ? "weekly" : "daily"})`
                          : `${row.label}: not reported`,
                      )
                      .join(" / ") +
                    "."}{" "}
              <Link to="/data-sources">Details</Link>
            </span>
            <SnapshotNotice compact />
          </div>
        </div>
      </div>
      <main id="main" tabIndex={-1}>
        {research && <ConnectionNotice />}
        {children}
      </main>
      <footer className="site-footer" lang="en">
        <div className="brand-rail" aria-hidden="true" />
        <div className="ui-container footer-inner">
          <SharedDisclaimer />
          <span>DengueWatch / Community health, in focus.</span>
          {preview && <span>Design preview · Illustrative data only</span>}
          <span>Thesis / research · Not an official DOH service</span>
          <span>Data attribution: {sourceAttribution()}</span>
          <span>
            Last data period:{" "}
            {coverage.loading
              ? "Checking published records…"
              : coverage.error
                ? "Unavailable (data service could not be reached)"
                : latest
                  ? `${formatDate(latest.date)} (${latest.label})`
                  : "No published records available"}
            .
            {coverage.data
              ?.filter((row) => row !== latest)
              .map((row) => (
                <span key={row.source}>
                  {" "}
                  {row.label}: {row.date ? formatDate(row.date) : "No records"}.
                </span>
              ))}{" "}
            Source date labels, not real-time data.{" "}
            {isSnapshotMode() && "Coverage from the verified demo snapshot."}
            {coverage.error && (
              <button className="text-link" onClick={coverage.retry}>
                Retry data period
              </button>
            )}
          </span>
          <span>
            <Link to="/data-sources">Data & Sources</Link> ·{" "}
            <Link to="/legal">Legal & privacy drafts</Link> ·{" "}
            <Link to="/terms">Terms</Link> ·{" "}
            <Link to="/privacy">Privacy & withdrawal</Link>
          </span>
        </div>
      </footer>
    </>
  );
}
