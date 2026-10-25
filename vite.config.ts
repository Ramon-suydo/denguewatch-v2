import { defineConfig, loadEnv } from "vite";
import {execFileSync} from "node:child_process";
import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (
    command === "build" &&
    (process.env.VITE_TEST_FIXTURES === "true" ||
      env.VITE_TEST_FIXTURES === "true")
  ) {
    throw new Error(
      "Production build blocked: VITE_TEST_FIXTURES must be disabled.",
    );
  }
  const publicEnv = {
    ...env,
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.startsWith("VITE_")),
    ),
  };
  if (mode === "staff") {
    try {
      const url = new URL(publicEnv.VITE_SUPABASE_URL || "");
      if (
        url.protocol !== "http:" ||
        !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
      )
        throw Error();
    } catch {
      throw new Error(
        "Local staff mode requires npm run setup:local and a loopback Supabase URL.",
      );
    }
  }
  for (const [name, value] of Object.entries(publicEnv)) {
    if (!value) continue;
    if (
      /SERVICE_ROLE|SECRET|DATABASE|PASSWORD|PRIVATE/.test(name) ||
      value.startsWith("sb_secret_")
    )
      throw new Error(
        "Client environment contains a private credential; build blocked.",
      );
    if (name === "VITE_SUPABASE_URL") {
      try {
        const url = new URL(value);
        if (
          url.username ||
          url.password ||
          !(
            url.protocol === "https:" ||
            (url.protocol === "http:" &&
              ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
          )
        )
          throw Error();
      } catch {
        throw new Error("Invalid public Supabase URL; build blocked.");
      }
    }
    if (name === "VITE_SUPABASE_ANON_KEY" && value.split(".").length === 3) {
      let role: string | undefined;
      try {
        role = JSON.parse(
          Buffer.from(value.split(".")[1], "base64url").toString(),
        ).role;
      } catch {
        throw new Error("Invalid public Supabase key; build blocked.");
      }
      if (role !== "anon")
        throw new Error(
          "Private Supabase role is forbidden in client configuration.",
        );
    } else if (
      name === "VITE_SUPABASE_ANON_KEY" &&
      command === "build" &&
      !value.startsWith("sb_publishable_")
    ) {
      throw new Error("Invalid public Supabase key; build blocked.");
    }
  }
  const version=JSON.parse(readFileSync('package.json','utf8')).version;
  let commit='unavailable';try{commit=execFileSync('git',['rev-parse','--short','HEAD'],{encoding:'utf8'}).trim();}catch{}
  const dataAsOf=JSON.parse(readFileSync('public/api/v2/manila.json','utf8')).data_as_of;
  const nationalAsOf=JSON.parse(readFileSync('data/processed/map_evaluation.json','utf8')).case_data_as_of;
  let evaluationDate='not recorded';try{evaluationDate=JSON.parse(readFileSync('data/processed/map_evaluation.json','utf8')).evaluation_date??'not recorded';}catch{}
  return {
    define:{__APP_META__:JSON.stringify({version,commit,evaluationDate,dataAsOf,nationalAsOf})},
    plugins: [react(), tailwindcss()],
    preview: {
      headers: Object.fromEntries(
        JSON.parse(readFileSync("vercel.json", "utf8")).headers[0].headers.map(
          (header: { key: string; value: string }) => [
            header.key,
            header.value,
          ],
        ),
      ),
    },
  };
});
