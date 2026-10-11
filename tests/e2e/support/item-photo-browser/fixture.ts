import { test as base, expect } from "@playwright/test";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));

/** Real client components and CSS; only Server Actions use controlled fixtures. */
export const test = base.extend<object, { photoURL: string }>({
  photoURL: [async ({}, provideFixture) => {
    const support = path.resolve("tests/e2e/support/item-photo-browser");
    const output = await mkdtemp(path.join(tmpdir(), "homeback-photo-browser-"));
    const source = path.resolve("src");
    let server: ReturnType<typeof createServer> | undefined;
    try {
      // Use the existing, pinned Next compiler; no new bundler dependency or app route.
      const { webpack } = require("next/dist/compiled/webpack/webpack");
      await new Promise<void>((resolve, reject) => {
        const compiler = webpack({
          mode: "development", devtool: false, target: "web",
          entry: path.join(support, "entry.tsx"),
          output: { path: output, filename: "form.js" },
          plugins: [new webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development", __NEXT_ROUTER_BASEPATH: "" }) })],
          resolve: {
            extensions: [".tsx", ".ts", ".js"], modules: [path.resolve("node_modules"), "node_modules"],
            alias: { "@/app/(app)/items/actions$": path.join(support, "actions.ts"), "@": source },
          },
          module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: path.join(support, "loader.mjs") }] },
        });
        compiler.run((error: Error | null, stats: { hasErrors(): boolean; toString(options: object): string }) => {
          compiler.close((closeError: Error | null) => {
            if (error || stats?.hasErrors()) reject(error ?? new Error(stats.toString({ all: false, errors: true })));
            else if (closeError) reject(closeError);
            else resolve();
          });
        });
      });
      const postcss = require("postcss");
      const css = await postcss([require("@tailwindcss/postcss")({ base: path.resolve(".") })])
        .process(await readFile(path.join(source, "app/globals.css"), "utf8"), { from: path.join(source, "app/globals.css") });
      const bundle = await readFile(path.join(output, "form.js"));
      server = createServer((req, res) => {
        if (req.url === "/form.js") { res.setHeader("content-type", "text/javascript; charset=utf-8"); res.end(bundle); }
        else if (req.url === "/form.css") { res.setHeader("content-type", "text/css; charset=utf-8"); res.end(css.css); }
        else { res.setHeader("content-type", "text/html; charset=utf-8"); res.end('<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/form.css"><main style="max-width:960px;padding:16px;margin:auto"><div id="root"></div><p id="saved" role="status"></p></main><script src="/form.js"></script></html>'); }
      });
      await new Promise<void>((resolve, reject) => {
        server!.once("error", reject);
        server!.listen(0, "127.0.0.1", resolve);
      });
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Expected loopback server port");
      await provideFixture(`http://127.0.0.1:${address.port}`);
    } finally {
      try {
        if (server?.listening) await new Promise<void>((resolve, reject) => server!.close((err) => err ? reject(err) : resolve()));
      } finally {
        // Delete only the absolute directory created by this fixture, including setup failures.
        if (path.dirname(output) !== path.resolve(tmpdir()) || !path.basename(output).startsWith("homeback-photo-browser-")) {
          throw new Error("Refusing cleanup outside the fixture temporary directory");
        }
        await rm(output, { recursive: true, force: true });
      }
    }
  }, { scope: "worker" }],
});
export { expect };
