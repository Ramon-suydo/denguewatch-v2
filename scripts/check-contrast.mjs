import assert from "node:assert/strict";
import { colors } from "../src/theme/palette.js";
function luminance(hex) {
  const rgb = hex
    .match(/[a-f\d]{2}/gi)
    .map((value) => parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function check(label, ink, background, minimum = 4.5) {
  const values = [luminance(ink), luminance(background)].sort((a, b) => b - a);
  const ratio = (values[0] + 0.05) / (values[1] + 0.05);
  assert.ok(
    ratio >= minimum,
    `${label}: ${ratio.toFixed(2)} is below ${minimum}`,
  );
  console.log(`${label}: ${ratio.toFixed(2)}:1`);
}
for (const [tier, value] of Object.entries(colors.risk))
  check("Risk " + tier, value.ink, value.surface);
for (const [source, value] of Object.entries(colors.source))
  check("Source " + source, value.ink, value.surface);
check("Primary button", colors.navy[950], colors.gold[500]);
check("Primary hover", colors.navy[950], colors.gold[400]);
check("Link on white", colors.navy[700], "#ffffff");
check("Link on paper", colors.navy[700], colors.paper);
check("Gold footer link", colors.gold[400], colors.navy[950]);
check("Cyan active dot", colors.pop.cyan, colors.navy[900], 3);
check("Muted text on warm surface", colors.neutral[600], colors.neutral[50]);
check("Input placeholder", colors.neutral[500], "#ffffff");
check("Hero heading", "#ffffff", colors.navy[900]);
check("Hero secondary text", colors.navy[200], colors.navy[900]);
check("Input boundary", colors.neutral[500], "#ffffff", 3);
check("Focus outline", colors.navy[600], "#ffffff", 3);
