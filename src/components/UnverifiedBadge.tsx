// Provenance never implies risk: use explicit labels, a distinct shape and icons.
export function UnverifiedBadge({
  source = "community",
}: {
  source?: "community" | "official";
}) {
  return (
    <span className={`source-badge source-${source}`}>
      <span aria-hidden="true">{source === "community" ? "◇" : "▤"}</span>
      {source === "community" ? "Community · Unverified" : "Official source"}
    </span>
  );
}
