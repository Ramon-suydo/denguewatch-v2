import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/source-sans-3/latin-400.css";
import "@fontsource/source-sans-3/latin-600.css";
import "@fontsource/source-sans-3/latin-700.css";
import "@fontsource/source-serif-4/latin-400.css";
import "@fontsource/source-serif-4/latin-400-italic.css";
import "@fontsource/source-serif-4/latin-600.css";
import "./index.css";
import { DesignPreview } from "./pages/DesignPreview";
import { ToastProvider } from "./components/ui";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <DesignPreview />
    </ToastProvider>
  </StrictMode>,
);
