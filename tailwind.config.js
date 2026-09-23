import { colors } from "./src/theme/palette.js";
export default {
  theme: {
    extend: {
      colors,
      // Source Serif's editorial clarity gives headings authority without academic
      // ornament. Source Sans has open counters and readable numerals for field data.
      // Locally bundled fonts keep the defense independent of external font services.
      fontFamily: {
        sans: ['"Source Sans 3"', '"Segoe UI"', "Arial", "sans-serif"],
        serif: ['"Source Serif 4"', "Georgia", '"Times New Roman"', "serif"],
      },
      borderRadius: { control: "0.5rem", card: "1rem", panel: "1.5rem" },
      boxShadow: {
        card: "0 4px 24px -8px rgb(16 57 56 / 0.10)",
        raised: "0 12px 32px -8px rgb(16 57 56 / 0.18)",
      },
      maxWidth: { content: "80rem" },
    },
  },
};
