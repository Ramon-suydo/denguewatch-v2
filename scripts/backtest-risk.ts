import { loadDataset } from "./lib/historical.ts";
import { backtest } from "../src/lib/composite.ts";
import type { Observation } from "../src/lib/types.ts";
import { mkdir, writeFile } from "node:fs/promises";
const data = await loadDataset("data/raw");
const rows = data.observations.map((r, i) => ({
  ...r,
  id: i,
  lgu_id: r.lgu_name,
})) as Observation[];
const result = backtest(rows);
await mkdir("docs", { recursive: true });
await writeFile(
  "docs/risk-backtest.json",
  JSON.stringify(
    {
      method:
        "paired rolling-origin; development before 2020, holdout 2020; 75% WMA + 25% seasonally scaled WMA; retain only >=5% MAE improvement on both splits and majority of cities improve",
      ...result,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    {
      selected: result.selected,
      development: result.development,
      holdout: result.holdout,
      cities: result.perCity.length,
    },
    null,
    2,
  ),
);
