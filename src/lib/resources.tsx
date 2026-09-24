import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  fetchCities,
  fetchRisks,
  fetchCommunity,
  fetchForecasts,
  fetchPolicy,
} from "./api";
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
  const [state, setState] = useState<{
    key: string;
    attempt: number;
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({ key, attempt, data: null, loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setState({ key, attempt, data: null, loading: true, error: null });
    Promise.resolve()
      .then(() => loader(controller.signal))
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ key, attempt, data, loading: false, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            key,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  const current =
    state.key === key && state.attempt === attempt
      ? state
      : { data: null, loading: true, error: null };
  return { ...current, retry: () => setAttempt((value) => value + 1) };
}
function useAppResources() {
  const cities = useResource("cities", fetchCities);
  const forecasts = useResource("forecasts", fetchForecasts);
  const community = useResource("community", fetchCommunity);
  const policy = useResource("policy", fetchPolicy);
  const risks = useResource("risks", fetchRisks);
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
