import { colors } from "../theme/palette.js";
import { simulatedLuminance, visionMatrices } from "./map-colors.js";
export function historicalFill(fraction: number | null) {
  if (fraction === null) return colors.neutral[200];
  const t = Math.max(0, Math.min(1, fraction));
  const parse = (hex: string) =>
    hex.match(/[a-f\d]{2}/gi)!.map((v) => parseInt(v, 16));
  const a = parse(colors.navy[50]),
    b = parse(colors.navy[700]);
  return (
    "#" +
    a
      .map((v, i) =>
        Math.round(v + (b[i] - v) * t)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function historicalStroke(fill: string) {
  const score = (ink: string) =>
    Math.min(
      ...Object.values(visionMatrices).map((matrix) => {
        const a = simulatedLuminance(fill, matrix),
          b = simulatedLuminance(ink, matrix);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      }),
    );
  return score(colors.navy[950]) >= score("#ffffff")
    ? colors.navy[950]
    : "#ffffff";
}
