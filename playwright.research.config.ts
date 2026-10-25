import { defineConfig } from "@playwright/test";
import production from "./playwright.production.config";
export default defineConfig({
 ...production, testDir:"./tests/ui",testMatch:["evidence.spec.ts","environment.spec.ts"],
 outputDir:".artifacts/production-research",use:{...production.use,serviceWorkers:"block",reducedMotion:"reduce"},
});
