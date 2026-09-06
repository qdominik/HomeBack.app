import fs from "node:fs";
import process from "node:process";

const requiredExampleKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_DEV_ORIGIN",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "E2E_BASE_URL",
  "E2E_PASSWORD",
];

function parseEnvFile(contents) {
  return new Set(
    contents
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1])
      .filter(Boolean),
  );
}

function readEnvFile(path) {
  if (!fs.existsSync(path)) return {};

  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2].replace(/^['"]|['"]$/g, "")]),
  );
}

function fail(messages) {
  for (const message of messages) console.error(`env contract: ${message}`);
  process.exitCode = 1;
}

if (process.argv.includes("--example")) {
  const keys = parseEnvFile(fs.readFileSync(".env.example", "utf8"));
  const missing = requiredExampleKeys.filter((key) => !keys.has(key));

  if (missing.length > 0) fail([`missing example keys: ${missing.join(", ")}`]);
  else console.log("env contract: .env.example declares the required names");
} else {
  const env = { ...readEnvFile(".env.local"), ...process.env };
  const environment = env.VERCEL_ENV ?? "local";
  const required = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
  ];

  if (environment === "local") required.push("NEXT_PUBLIC_DEV_ORIGIN");

  const missing = required.filter((key) => !env[key]?.trim());
  const hasPublicKey = Boolean(
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );

  if (!hasPublicKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) fail([`missing required variables: ${missing.join(", ")}`]);
  else console.log(`env contract: ${environment} required names are present`);
}
