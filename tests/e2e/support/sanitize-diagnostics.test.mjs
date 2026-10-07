import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { publishDiagnostics, readZip, redactor, sanitizeTrace, summarize, writeZip } from "./sanitize-diagnostics.mjs";

const secrets = ["Password123!", "env-secret-key", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature", "unknown-password", "unknown-cookie", "unknown-token"];
const require = createRequire(import.meta.url);
const { iso: { TraceLoader, TraceModel } } = require(join(dirname(require.resolve("playwright-core/package.json")), "lib/coreBundle.js"));
const report = { suites: [{ title: "filters", specs: [{ title: "latest room", file: "tests/e2e/item-filter-navigation.spec.ts", line: 107,
  tests: [{ projectName: "chromium", status: "flaky", results: [{ retry: 0, status: "failed", duration: 1, errors: [{ message: "Password123!" }] }, { retry: 1, status: "passed", duration: 2, errors: [] }] }] },
{ title: "fixture", file: "fixture.spec.ts", line: 3, tests: [{ status: "skipped", results: [{ retry: 0, status: "skipped" }] }] }] }] };
const events = [
  { type: "context-options", version: 9, origin: "library", browserName: "chromium", platform: "linux", wallTime: 1000, monotonicTime: 0, sdkLanguage: "javascript", playwrightVersion: "1.63.0", options: { storageState: { cookies: [{ value: secrets[4] }] }, httpCredentials: { password: secrets[3] } } },
  { type: "before", callId: "call@1", startTime: 1, apiName: "locator.fill", class: "Page", method: "fill", pageId: "page@1", params: { selector: "password", value: secrets[3] } },
  { type: "after", callId: "call@1", endTime: 2, result: secrets[1], error: { message: secrets.join(" ") }, attachments: [{ body: secrets[1] }] },
  { type: "frame-snapshot", snapshot: { html: ["input", { value: secrets[3] }] } },
  { type: "console", text: secrets[1] },
  { type: "screencast-frame", sha1: "image", pageId: "page@1" },
];
const network = { type: "resource-snapshot", snapshot: { _frameref: "frame@1", _monotonicTime: 1, time: 3, startedDateTime: "2026-10-07T00:00:00Z",
  request: { method: "GET", url: `http://user:${secrets[3]}@127.0.0.1/items?category=abc&room=two&access_token=${secrets[5]}#${secrets[5]}`, httpVersion: "HTTP/1.1", headers: [{ name: "Authorization", value: secrets[2] }, { name: "apikey", value: secrets[1] }], cookies: [{ value: secrets[4] }], postData: { text: secrets[3] } },
  response: { status: 200, statusText: secrets[1], httpVersion: "HTTP/1.1", headers: [{ name: "set-cookie", value: secrets[4] }], cookies: [{ value: secrets[4] }], content: { _sha1: "body", text: secrets[2] }, redirectURL: `http://127.0.0.1/accept?invitation_token=${secrets[5]}` }, timings: { wait: 1, receive: 2 } } };

async function fixture(fn) {
  const dir = await mkdtemp(join(tmpdir(), "e2e-redaction-"));
  try { await fn(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}

test("trace ZIP preserves viewer context/actions/network URL and omits all credential carriers", async () => fixture(async (dir) => {
  const raw = join(dir, "raw.zip");
  const safe = join(dir, "safe.zip");
  await writeZip(raw, [
    { name: "0.trace", data: events.map(JSON.stringify).join("\n") },
    { name: "0.network", data: JSON.stringify(network) },
    { name: "resources/body", data: secrets.join(" ") },
    { name: "resources/image.png", data: Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.from(secrets[1])]) },
    { name: "resources/source.txt", data: secrets[3] },
  ]);
  await sanitizeTrace(raw, safe, redactor({ E2E_LOCAL_SUPABASE_SERVICE_ROLE_KEY: secrets[1] }));
  const entries = await readZip(safe, { metadataOnly: false });
  assert.deepEqual(entries.map((entry) => entry.name), ["0.trace", "0.network"]);
  const contents = entries.map((entry) => entry.data.toString()).join("\n");
  for (const secret of secrets) assert.equal(contents.includes(secret), false);
  const trace = entries[0].data.toString().trim().split("\n").map(JSON.parse);
  assert.equal(trace[0].version, 9);
  assert.equal(trace[0].browserName, "chromium");
  assert.deepEqual(trace[0].options, {});
  assert.deepEqual(trace.map((event) => event.type), ["context-options", "before", "after"]);
  assert.equal(trace[1].callId, trace[2].callId);
  const resource = JSON.parse(entries[1].data.toString()).snapshot;
  assert.equal(resource.response.status, 200);
  assert.match(resource.request.url, /category=abc&room=two/);
  assert.equal(new URL(resource.request.url).hash, "");
  assert.equal(new URL(resource.request.url).username, "");
  assert.deepEqual(resource.request.headers, []);
  assert.equal(resource.request.postData, undefined);
  assert.equal(resource.response.content._sha1, undefined);
  // Load through the very same model as the pinned show-trace viewer.
  const data = new Map(entries.map((entry) => [entry.name, entry.data.toString()]));
  const loader = new TraceLoader();
  await loader.load({ entryNames: async () => [...data.keys()], readText: async (name) => data.get(name), isLive: () => false, traceURL: () => safe });
  const model = new TraceModel(safe, loader.contextEntries);
  assert.equal(model.browserName, "chromium");
  assert.equal(model.actions.length, 1);
  assert.equal(model.resources.length, 1);
  assert.match(model.resources[0].request.url, /category=abc&room=two/);
}));

test("redacts known env values, encoded secrets, JWT, bearer and credential fields", () => {
  const redact = redactor({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: secrets[1] });
  const text = redact(`${secrets[1]} ${encodeURIComponent(secrets[0])} ${secrets[2]} Bearer some-other-key password=arbitrary api_key=value`);
  for (const secret of [...secrets.slice(0, 3), "some-other-key", "arbitrary", "api_key=value"]) assert.equal(text.includes(secret), false);
});

test("summary distinguishes successful retry from first pass and skipped tests", () => {
  const summary = summarize(report, redactor({}));
  assert.deepEqual(summary.counts, { passed: 0, failed: 0, skipped: 1, flaky: 1, retries: 1, firstAttemptFailures: 1 });
  assert.deepEqual(summary.tests[0].attempts.map(({ retry, status }) => ({ retry, status })), [{ retry: 0, status: "failed" }, { retry: 1, status: "passed" }]);
  assert.equal(JSON.stringify(summary).includes("Password123!"), false);
});

test("publication excludes screenshot/video/status and writes every attempt", async () => fixture(async (dir) => {
  await mkdir(join(dir, "failure"));
  const trace = join(dir, "failure", "trace.zip");
  const attachedReport = structuredClone(report);
  attachedReport.suites[0].specs[0].tests[0].results[0].attachments = [{ name: "trace", path: trace }];
  await writeFile(join(dir, "e2e-results.json"), JSON.stringify(attachedReport));
  await writeZip(trace, [{ name: "test.trace", data: events.map(JSON.stringify).join("\n") }]);
  await writeFile(join(dir, "failure", "screenshot.png"), secrets[1]);
  await writeFile(join(dir, "failure", "video.webm"), secrets[1]);
  await writeFile(join(dir, "supabase-status.txt"), secrets[1]);
  const output = join(dir, "safe-diagnostics", "main");
  await publishDiagnostics(dir, output, {});
  const summary = JSON.parse(await readFile(join(output, "attempts.json")));
  assert.equal(summary.counts.flaky, 1);
  assert.deepEqual(summary.traces, ["trace-1.zip"]);
  assert.deepEqual(summary.tests[0].attempts[0].traces, ["trace-1.zip"]);
  assert.deepEqual(summary.tests[0].attempts[1].traces, []);
  assert.equal(JSON.stringify(summary).includes(dir), false);
  await assert.rejects(access(join(output, "supabase-status.txt")));
  await assert.rejects(access(join(output, "screenshot.png")));
  assert.match(await readFile(join(output, "README.txt"), "utf8"), /DOM.*omitted/);
}));

test("malformed trace fails closed and removes already written sanitized files", async () => fixture(async (dir) => {
  await mkdir(join(dir, "failure"));
  await writeFile(join(dir, "e2e-results.json"), JSON.stringify(report));
  await writeZip(join(dir, "failure", "trace.zip"), [{ name: "0.trace", data: "not json " + secrets[1] }]);
  const output = join(dir, "safe-diagnostics", "main");
  await assert.rejects(publishDiagnostics(dir, output, {}), /no artifacts are safe/);
  await assert.rejects(access(output));
}));

test("unrecognized trace format or invalid UTF-8 cannot be published", async () => fixture(async (dir) => {
  const raw = join(dir, "raw.zip");
  await writeZip(raw, [{ name: "0.trace", data: JSON.stringify({ type: "before", callId: "x" }) }]);
  await assert.rejects(sanitizeTrace(raw, join(dir, "safe.zip"), redactor({})), /context\/version/);
  await writeZip(raw, [{ name: "0.trace", data: Buffer.from([0xc3, 0x28]) }]);
  await assert.rejects(sanitizeTrace(raw, join(dir, "safe.zip"), redactor({})));
}));
