import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { snapshotDate, subscribeSnapshot } from "./demo-snapshot";
export interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}
export function useResource<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>,
): Resource<T> {
  const [attempt, setAttempt] = useState(0);
  const mode = useSyncExternalStore(
    subscribeSnapshot,
    snapshotDate,
    () => null,
  );
  const [state, setState] = useState<{
    key: string;
    mode: string | null;
    attempt: number;
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({ key, mode, attempt, data: null, loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setState({ key, mode, attempt, data: null, loading: true, error: null });
    Promise.resolve()
      .then(() => loader(controller.signal))
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ key, mode, attempt, data, loading: false, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            key,
            mode,
            attempt,
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load this section.",
          });
      });
    return () => controller.abort();
    // key is the complete identity of a read. Avoid rerunning on inline loaders.
  }, [key, attempt, mode]);
  const current =
    state.key === key && state.attempt === attempt && state.mode === mode
      ? state
      : { data: null, loading: true, error: null };
  return { ...current, retry: () => setAttempt((value) => value + 1) };
}
function useAppResources() {
  const cities = useResource("cities", async (signal) =>
    (await (await import("./api")).fetchCities(signal)).filter((city) => city.name === "MANILA CITY"),
  );
  const forecasts = useResource("forecasts", async signal => (await import("./api")).fetchForecasts(signal));
  const community = useResource("community", async signal => (await import("./api")).fetchCommunity(signal));
  const policy = useResource("policy", async signal => (await import("./api")).fetchPolicy(signal));
  const risks = useResource("risks", async signal => (await import("./api")).fetchRisks(signal));
  return { cities, forecasts, community, policy, risks };
}
const Context = createContext<ReturnType<typeof useAppResources> | null>(null);
export function AppDataProvider({ children }: { children: ReactNode }) {
  const value = useAppResources();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAppData() {
  const value = useContext(Context);
  if (!value) throw new Error("AppDataProvider is required");
  return value;
}
