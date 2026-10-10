import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

// Internal ZIP API from the already pinned Playwright. No new dependency.
const require = createRequire(import.meta.url);
const { yauzl, yazl } = require(join(dirname(require.resolve("playwright-core/package.json")), "lib/utilsBundle.js"));
const MAX_ENTRY = 32 * 1024 * 1024;
const sensitive = /password|passwd|secret|token|cookie|authorization|api[_-]?key|credential/i;
const limitations = "Only action timing, request URL/status metadata, allowlisted navigation flags and filter UUID/state diagnostics are published. DOM, sources, console, bodies, credentials, screenshots, video and binary resources are omitted.";

function navigationHeaders(headers = []) {
  const result = [];
  for (const header of headers) {
    const name = String(header.name).toLowerCase();
    if (name === "rsc" && header.value === "1") result.push({ name, value: "1" });
    if (name === "next-router-prefetch" && ["1", "2", "3"].includes(header.value)) result.push({ name, value: header.value });
    if (name === "next-router-segment-prefetch") result.push({ name, value: "[PRESENT]" });
  }
  return result;
}

export function sanitizeFilterNavigation(input) {
  if (!Array.isArray(input) || input.length > 100) throw new Error("Invalid filter diagnostic structure");
  const uuid = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
  const filters = (value) => value && typeof value === "object" ? { category: uuid(value.category), room: uuid(value.room) } : null;
  return input.filter((event) => ["request", "before-first", "before-second"].includes(event?.phase)).map((event) => ({
    phase: event.phase,
    time: Number.isFinite(event.time) ? event.time : null,
    category: uuid(event.category), room: uuid(event.room),
    ...(event.phase === "request" ? { rsc: event.rsc === true, segment: event.segment === true, navigation: event.navigation === true,
      prefetch: ["1", "2", "3"].includes(event.prefetch) ? event.prefetch : null } : {
      mounted: event.mounted === true, firstChip: event.firstChip === true,
      pending: typeof event.pending === "boolean" ? event.pending : null,
      intended: filters(event.intended), optimistic: filters(event.optimistic), base: filters(event.base),
    }),
  }));
}

function filterAttachments(attachments = []) {
  return attachments.filter((attachment) => attachment.name === "filter-navigation" && attachment.contentType === "application/json" && typeof attachment.body === "string").flatMap((attachment) => {
    if (attachment.body.length > 128 * 1024) throw new Error("Filter diagnostics exceed size limit");
    return sanitizeFilterNavigation(JSON.parse(Buffer.from(attachment.body, "base64").toString("utf8")));
  });
}

export function redactor(env = process.env) {
  const values = ["Password123!", ...Object.entries(env).filter(([name]) => sensitive.test(name) || /(?:publishable|anon|service_role).*key/i.test(name)).map(([, value]) => value)]
    .filter((value) => value && value.length >= 4);
  const variants = [...new Set(values.flatMap((value) => [value, encodeURIComponent(value)]))].sort((a, b) => b.length - a.length);
  return (input) => {
    let text = String(input);
    for (const value of variants) text = text.split(value).join("[REDACTED]");
    return text
      .replace(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED]")
      .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+\b/g, "[REDACTED]")
      .replace(/\bBearer\s+[^\s"'<>]+/gi, "Bearer [REDACTED]")
      .replace(/((?:password|passwd|secret|token|cookie|authorization|api[_-]?key|credential)[\w-]*\s*[=:]\s*)([^\s&,;"'<>]+)/gi, "$1[REDACTED]");
  };
}

function safeURL(value, redact) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (sensitive.test(key)) url.searchParams.set(key, "[REDACTED]");
    }
    return redact(url.toString());
  } catch {
    return "[OMITTED URL]";
  }
}

function pick(source, keys, redact) {
  const result = {};
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") result[key] = redact(value);
    else if (typeof value === "number" || typeof value === "boolean") result[key] = value;
  }
  return result;
}

export function sanitizeEvent(event, redact) {
  switch (event.type) {
    case "context-options":
      return { ...pick(event, ["type", "version", "origin", "browserName", "channel", "platform", "wallTime", "monotonicTime", "sdkLanguage", "playwrightVersion", "testIdAttributeName", "testTimeout"], redact), options: {} };
    case "before":
    case "action":
      return { ...pick(event, ["type", "callId", "parentId", "startTime", "endTime", "apiName", "class", "method", "pageId", "stepId"], redact), params: event.params?.url ? { url: safeURL(event.params.url, redact) } : {} };
    case "after":
      return { ...pick(event, ["type", "callId", "endTime"], redact), ...(event.error ? { error: { name: "Error", message: "Failure details omitted; consult the CI assertion and sanitized network metadata." } } : {}) };
    case "event":
      if (!["page", "pageClosed", "navigated"].includes(event.method)) return null;
      return { ...pick(event, ["type", "time", "class", "method", "pageId"], redact), params: { ...pick(event.params ?? {}, ["pageId"], redact), ...(event.params?.url ? { url: safeURL(event.params.url, redact) } : {}) } };
    case "resource-snapshot": {
      const snapshot = event.snapshot;
      if (!snapshot?.request || !snapshot.response) throw new Error("Invalid network trace metadata");
      return { type: event.type, snapshot: {
        ...pick(snapshot, ["_frameref", "_monotonicTime", "pageref", "startedDateTime", "time"], redact),
        request: { ...pick(snapshot.request, ["method", "httpVersion"], redact), url: safeURL(snapshot.request.url, redact), cookies: [], headers: navigationHeaders(snapshot.request.headers), queryString: [], headersSize: -1, bodySize: -1 },
        response: { ...pick(snapshot.response, ["status", "httpVersion"], redact), statusText: "", cookies: [], headers: [], content: { size: 0, mimeType: "text/plain" }, redirectURL: snapshot.response.redirectURL ? safeURL(snapshot.response.redirectURL, redact) : "", headersSize: -1, bodySize: -1 },
        cache: {}, timings: pick(snapshot.timings ?? {}, ["blocked", "dns", "connect", "send", "wait", "receive", "ssl"], redact),
      } };
    }
    default:
      return null; // Unknown event types never pass through unreviewed.
  }
}

export async function readZip(path, { metadataOnly = true } = {}) {
  const zip = await new Promise((res, rej) => yauzl.open(path, { lazyEntries: true }, (error, value) => error ? rej(error) : res(value)));
  return new Promise((res, rej) => {
    const entries = [];
    let size = 0;
    let count = 0;
    zip.on("error", rej);
    zip.on("end", () => res(entries));
    zip.on("entry", (entry) => {
      if (++count > 5000) { zip.close(); rej(new Error("Too many ZIP entries")); return; }
      // Never read binary resources, source, snapshots or arbitrary attachments.
      if (metadataOnly && !/^[\w.-]+\.(trace|network)$/.test(entry.fileName)) { zip.readEntry(); return; }
      size += entry.uncompressedSize;
      if (entry.uncompressedSize > MAX_ENTRY || size > 128 * 1024 * 1024) { zip.close(); rej(new Error("Trace exceeds diagnostic size limit")); return; }
      zip.openReadStream(entry, (error, stream) => {
        if (error) { zip.close(); rej(error); return; }
        const chunks = [];
        stream.on("data", (data) => chunks.push(data));
        stream.on("error", rej);
        stream.on("end", () => { entries.push({ name: entry.fileName, data: Buffer.concat(chunks) }); zip.readEntry(); });
      });
    });
    zip.readEntry();
  });
}

export async function writeZip(path, entries) {
  const zip = new yazl.ZipFile();
  for (const entry of entries) zip.addBuffer(Buffer.from(entry.data), entry.name);
  zip.end();
  await pipeline(zip.outputStream, createWriteStream(path));
}

export async function sanitizeTrace(input, output, redact) {
  const entries = await readZip(input);
  if (!entries.some((entry) => entry.name.endsWith(".trace"))) throw new Error("No trace metadata");
  const sanitized = entries.map((entry) => {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(entry.data);
    const events = text.split("\n").filter(Boolean).map((line) => sanitizeEvent(JSON.parse(line), redact)).filter(Boolean);
    if (entry.name.endsWith(".trace") && !events.some((event) => event.type === "context-options" && event.version === 9)) throw new Error("Missing or unsupported trace context/version");
    return { name: entry.name, data: events.map((event) => JSON.stringify(event)).join("\n") + "\n" };
  });
  await writeZip(output, sanitized);
}

export function summarize(report, redact, traceNames = new Map()) {
  const tests = [];
  function walk(suites, parents = []) {
    for (const suite of suites ?? []) {
      const title = [...parents, suite.title];
      for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
        tests.push({ title: redact([...title, spec.title].join(" > ")), file: redact(spec.file), line: spec.line, project: redact(test.projectName), outcome: test.status,
          attempts: (test.results ?? []).map((result) => ({ retry: result.retry, status: result.status, duration: result.duration, errors: (result.errors ?? []).length,
            filterNavigation: filterAttachments(result.attachments),
            traces: (result.attachments ?? []).filter((attachment) => attachment.name === "trace" && typeof attachment.path === "string").map((attachment) => traceNames.get(resolve(attachment.path))).filter(Boolean) })) });
      }
      walk(suite.suites, title);
    }
  }
  walk(report.suites);
  return { limitations, tests, counts: {
    passed: tests.filter((test) => test.outcome === "expected").length,
    failed: tests.filter((test) => test.outcome === "unexpected").length,
    skipped: tests.filter((test) => test.outcome === "skipped").length,
    flaky: tests.filter((test) => test.outcome === "flaky").length,
    retries: tests.reduce((sum, test) => sum + test.attempts.filter((attempt) => attempt.retry > 0).length, 0),
    firstAttemptFailures: tests.filter((test) => test.attempts.some((attempt) => attempt.retry === 0 && ["failed", "timedOut", "interrupted"].includes(attempt.status))).length,
  } };
}

async function traces(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error("Diagnostic symlink rejected");
    const path = join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "safe-diagnostics") result.push(...await traces(path));
    else if (entry.isFile() && entry.name === "trace.zip") result.push(path);
  }
  return result.sort();
}

export async function publishDiagnostics(input, output, env = process.env) {
  if (resolve(input) === resolve(output) || !resolve(output).startsWith(resolve(input) + "/") && !resolve(output).startsWith(resolve(input) + "\\")) throw new Error("Output must be a separate child of test results");
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  try {
    const redact = redactor(env);
    const report = JSON.parse(await readFile(join(input, "e2e-results.json"), "utf8"));
    const paths = await traces(input);
    const traceNames = new Map(paths.map((path, index) => [resolve(path), `trace-${index + 1}.zip`]));
    const summary = summarize(report, redact, traceNames);
    for (let index = 0; index < paths.length; index++) await sanitizeTrace(paths[index], join(output, `trace-${index + 1}.zip`), redact);
    summary.traces = paths.map((_, index) => `trace-${index + 1}.zip`);
    await writeFile(join(output, "attempts.json"), JSON.stringify(summary, null, 2));
    await writeFile(join(output, "README.txt"), limitations + "\nOpen trace-N.zip with the pinned Playwright show-trace. See attempts.json for every first attempt, retry and skipped test.\n");
    console.log(JSON.stringify(summary.counts));
  } catch {
    // Fail closed: never leave a partially sanitized publication directory.
    await rm(output, { recursive: true, force: true });
    // Parser errors can include raw secret-bearing input; do not log the cause.
    throw new Error("E2E diagnostic redaction failed; no artifacts are safe to publish");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const label = process.argv[2];
  if (!/^[a-z-]+$/.test(label ?? "")) throw new Error("Expected diagnostic run label");
  await publishDiagnostics(resolve("test-results"), resolve("test-results/safe-diagnostics", label));
}
