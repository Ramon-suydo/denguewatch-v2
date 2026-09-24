export type RiskLevel =
  "Low" | "Medium" | "Moderate" | "High" | "Insufficient data";
const tiers = {
  Low: ["low", "●"],
  Medium: ["moderate", "\u25b2"],
  Moderate: ["moderate", "▲"],
  High: ["high", "◆"],
  "Insufficient data": ["insufficient", "—"],
} as const;
export function RiskBadge({ level }: { level: RiskLevel }) {
  const [tier, symbol] = tiers[level];
  return (
    <span className={`risk-badge risk-${tier}`}>
      <span aria-hidden="true">{symbol}</span>
      <span>
        {level}
        {level !== "Insufficient data" && " risk"}
      </span>
    </span>
  );
}
