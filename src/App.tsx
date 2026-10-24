import {
  Component,
  lazy,
  Suspense,
  useLayoutEffect,
  type ReactNode,
} from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { LayoutShell, Button, Card } from "./components/ui";
import { Loading } from "./components/PageState";
import { AppDataProvider } from "./lib/resources";
const Home = lazy(() =>
  import("./pages/EvidenceHome").then((m) => ({ default: m.EvidenceHome })),
);
const Trends = lazy(() =>
  import("./pages/EvidenceTrends").then((m) => ({ default: m.EvidenceTrends })),
);
const Metro = lazy(() =>
  import("./pages/MetroHistory").then((m) => ({ default: m.MetroHistory })),
);
const Methods = lazy(() =>
  import("./pages/Methodology").then((m) => ({ default: m.Methodology })),
);
const Prevention = lazy(() =>
  import("./pages/Prevention").then((m) => ({ default: m.Prevention })),
);
const Community = lazy(() =>
  import("./pages/CommunityReports").then((m) => ({
    default: m.CommunityReports,
  })),
);
const Report = lazy(() =>
  import("./pages/ReportV2").then((m) => ({ default: m.ReportV2 })),
);
const Admin = lazy(() =>
  import("./pages/Admin").then((m) => ({ default: m.Admin })),
);
const LegacyReport =
  import.meta.env.DEV && import.meta.env.VITE_TEST_FIXTURES === "true"
    ? lazy(() => import("./pages/Report").then((m) => ({ default: m.Report })))
    : null;
const Privacy = lazy(() =>
  import("./pages/Privacy").then((m) => ({ default: m.Privacy })),
);
const Terms = lazy(() =>
  import("./pages/Terms").then((m) => ({ default: m.Terms })),
);
const Legal = lazy(() =>
  import("./pages/Legal").then((m) => ({ default: m.Legal })),
);
const DataSources = lazy(() =>
  import("./pages/DataSources").then((m) => ({ default: m.DataSources })),
);
const DesignPreview =
  import.meta.env.DEV && import.meta.env.VITE_TEST_FIXTURES === "true"
    ? lazy(() =>
        import("../tests/fixtures/DesignPreview").then((m) => ({
          default: m.DesignPreview,
        })),
      )
    : null;
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="ui-container app-content">
        <Card>
          <h1>This page could not open</h1>
          <p role="alert">
            Reload the page to retry. A report must never be submitted
            automatically.
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
  useLayoutEffect(() => {
    const names: Record<string, string> = {
      "/": "Manila dengue evidence",
      "/trends": "Manila trends",
      "/metro-manila": "Metro Manila history",
      "/map": "Metro Manila history",
      "/methodology": "Methodology",
      "/prevention": "Prevention",
      "/report": "Community report",
      "/privacy": "Privacy",
      "/data-sources": "Data & Sources",
    };
    document.title =
      (names[location.pathname] ?? "DengueWatch") + " | DengueWatch";
    document.documentElement.lang = "en";
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      document.getElementById("main")?.focus({ preventScroll: true });
    }
  }, [location.pathname, location.hash]);
  if (location.pathname.startsWith("/admin"))
    return (
      <Boundary>
        <Suspense fallback={<Loading label="Opening staff sign in…" />}>
          <Admin />
        </Suspense>
      </Boundary>
    );
  if (location.pathname === "/dev" && DesignPreview)
    return (
      <Suspense fallback={<Loading />}>
        <DesignPreview />
      </Suspense>
    );
  return (
    <LayoutShell
      research
      items={[
        { label: "Home", href: "/", active: location.pathname === "/" },
        {
          label: "Trends",
          href: "/trends",
          active: location.pathname === "/trends",
        },
        {
          label: "Metro Manila",
          href: "/metro-manila",
          active: ["/metro-manila", "/map"].includes(location.pathname),
        },
        {
          label: "Prevention",
          href: "/prevention",
          active: location.pathname === "/prevention",
        },
        {
          label: "Methodology",
          href: "/methodology",
          active: location.pathname === "/methodology",
        },
      ]}
      action={
        <Link className="community-link" to="/report">
          Community reports: opening soon
        </Link>
      }
    >
      <Boundary key={location.pathname}>
        <Suspense
          fallback={
            <div className="ui-container app-content">
              <Loading label="Opening page…" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/trends" element={<Trends />} />
            <Route
              path="/city/:id"
              element={<Navigate to="/trends" replace />}
            />
            <Route path="/map" element={<Metro />} />
            <Route path="/metro-manila" element={<Metro />} />
            <Route path="/methodology" element={<Methods />} />
            <Route path="/prevention" element={<Prevention />} />
            <Route path="/community" element={<Community />} />
            <Route path="/report" element={<Report />} />
            {LegacyReport && (
              <Route
                path="/dev/legacy-report"
                element={
                  <AppDataProvider>
                    <LegacyReport />
                  </AppDataProvider>
                }
              />
            )}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/data-sources" element={<DataSources />} />
            <Route
              path="*"
              element={
                <div className="ui-container app-content">
                  <Card>
                    <h1>Page not found</h1>
                    <p>
                      This address does not match a public DengueWatch page.
                    </p>
                    <Link className="text-link" to="/">
                      Return home
                    </Link>
                  </Card>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </Boundary>
    </LayoutShell>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <PublicRoutes />
    </BrowserRouter>
  );
}
