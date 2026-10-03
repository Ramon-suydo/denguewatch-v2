import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { LayoutShell, Button, Card } from "./components/ui";
import { Loading } from "./components/PageState";
import { AppDataProvider } from "./lib/resources";
const Legal = lazy(() => import("./pages/Legal").then(module => ({ default: module.Legal })));
const Dashboard = lazy(() => import("./pages/Dashboard").then(module => ({ default: module.Dashboard })));
const CityDetail = lazy(() =>
  import("./pages/CityDetail").then((module) => ({
    default: module.CityDetail,
  })),
);
const MapPage = lazy(() =>
  import("./pages/MapPage").then((module) => ({ default: module.MapPage })),
);
const Report = lazy(() =>
  import("./pages/Report").then((module) => ({ default: module.Report })),
);
const Privacy = lazy(() =>
  import("./pages/Privacy").then((module) => ({ default: module.Privacy })),
);
const Terms = lazy(() =>
  import("./pages/Terms").then((module) => ({ default: module.Terms })),
);
const DataSources = lazy(() =>
  import("./pages/DataSources").then((module) => ({ default: module.DataSources })),
);
const DesignPreview = lazy(() =>
  import("./pages/DesignPreview").then((module) => ({
    default: module.DesignPreview,
  })),
);
class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="dw-container app-content">
        <Card>
          <h1>This page could not open</h1>
          <p role="alert">
            Please reload the application. If you were submitting a report, do
            not automatically send it again.
          </p>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </Card>
      </div>
    ) : (
      this.props.children
    );
  }
}
function PublicRoutes() {
  const location = useLocation();
  useEffect(() => {
    document.title =
      (location.pathname === "/map"
        ? "NCR map"
        : location.pathname === "/report"
          ? "Community report"
          : location.pathname === "/data-sources"
            ? "Data & Sources"
            : location.pathname === "/legal"
              ? "Legal and privacy drafts"
              : location.pathname === "/privacy"
              ? "Privacy"
              : location.pathname === "/terms"
                ? "Terms"
                : location.pathname.startsWith("/city/")
                  ? "City history"
                  : "Public dashboard") + " | DengueWatch";
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      document.getElementById("main")?.focus({ preventScroll: true });
    }
  }, [location.pathname, location.hash]);
  if (location.pathname === "/design-preview")
    return (
      <Suspense fallback={<Loading />}>
        <DesignPreview />
      </Suspense>
    );
  return (
    <AppDataProvider>
      <LayoutShell
        items={[
          {
            label: "Dashboard",
            href: "/",
            active:
              location.pathname === "/" || location.pathname === "/dashboard",
          },
          { label: "Map", href: "/map", active: location.pathname === "/map" },
          {
            label: "Data & Sources",
            href: "/data-sources",
            active: location.pathname === "/data-sources",
          },
          {
            label: "Privacy",
            href: "/privacy",
            active: location.pathname === "/privacy" || location.pathname === "/legal",
          },
        ]}
        action={
          <Link className="dw-button dw-button-primary" to="/report">
            Report a signal ↗
          </Link>
        }
      >
        <AppErrorBoundary key={location.pathname}>
          <Suspense
            fallback={
              <div className="dw-container app-content">
                <Loading label="Opening page…" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/city/:id" element={<CityDetail />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/report" element={<Report />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/data-sources" element={<DataSources />} />
              <Route
                path="*"
                element={
                  <div className="dw-container app-content">
                    <Card>
                      <h1>Page not found</h1>
                      <p>This address does not match a DengueWatch page.</p>
                      <Link className="text-link" to="/">
                        Return to the dashboard
                      </Link>
                    </Card>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
      </LayoutShell>
    </AppDataProvider>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <PublicRoutes />
    </BrowserRouter>
  );
}
