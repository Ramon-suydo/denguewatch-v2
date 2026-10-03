import { useSyncExternalStore } from "react";
import { Badge } from "./ui";
import { snapshotDate, subscribeSnapshot } from "../lib/demo-snapshot";
import { formatDate } from "../lib/dates";
export function SnapshotNotice({ compact = false }: { compact?: boolean }) {
  const date = useSyncExternalStore(subscribeSnapshot, snapshotDate, () => null);
  return date ? <p role="status" className="snapshot-notice"><Badge>Offline demo snapshot ({formatDate(date)})</Badge>{!compact && " Verified historical data; community reports and submissions are unavailable."}</p> : null;
}
