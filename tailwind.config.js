import { colors } from "./src/theme/palette.js";
export default {
  theme: {
    extend: {
      colors,
      // Requested fonts are bundled locally; no remote font loader.
      fontFamily: {
        sans: ['"Roboto"', "Arial", "sans-serif"],
        display: ['"Montserrat"', "Arial", "sans-serif"],
        serif: ['"Fraunces"', "Georgia", "serif"],
      },
      borderRadius: { control: "0.5rem", card: "1rem", panel: "1.5rem" },
      boxShadow: {
        card: "0 10px 30px -20px rgba(7,11,31,.32)",
        raised: "0 22px 44px -22px rgba(7,11,31,.35)",
      },
      maxWidth: { content: "80rem" },
    },
  },
};
