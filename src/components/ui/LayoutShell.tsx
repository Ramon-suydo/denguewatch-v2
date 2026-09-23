import { useState, type ReactNode } from "react";
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
        <a className="wordmark" href="#main" aria-label="DengueWatch home">
          <span className="brand-symbol">
            <MonitoringLine />
          </span>
          <span>
            Dengue<span className="wordmark-light">Watch</span>
          </span>
        </a>
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
        >
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              onClick={() => setExpanded(false)}
            >
              {item.label}
            </a>
          ))}
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
}: {
  children: ReactNode;
  items: NavItem[];
  action?: ReactNode;
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
        <span>
          DengueWatch <span aria-hidden="true">/</span> Community health, in
          focus.
        </span>
        <span>Design preview · Illustrative data only</span>
      </footer>
    </>
  );
}
