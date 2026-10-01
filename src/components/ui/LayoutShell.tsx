import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { MonitoringLine } from "./MonitoringLine";
export type NavItem = { label: string; href: string; active?: boolean };
export function TopNav({
  items,
  action,
}: {
  items: NavItem[];
  action?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <header className="top-nav">
      <div className="dw-container nav-inner">
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
          {expanded ? "Close menu" : "Menu ☰"}
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
    </header>
  );
}
export function LayoutShell({
  children,
  items,
  action,
  preview = false,
}: {
  children: ReactNode;
  items: NavItem[];
  action?: ReactNode;
  preview?: boolean;
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <TopNav items={items} action={action} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="dw-container site-footer">
        <span>DengueWatch / Community health, in focus.</span>
        {preview ? (
          <span>Design preview · Illustrative data only</span>
        ) : (
          <>
            <span>Thesis / research · Not an official DOH service</span>
            <span>
              <Link to="/data-sources">Data & Sources</Link> ·{" "}
              <Link to="/terms">Terms</Link> ·{" "}
              <Link to="/privacy">Privacy & withdrawal</Link>
            </span>
          </>
        )}
      </footer>
    </>
  );
}
