import path from "node:path";
import { globSync as tinyGlobSync, isDynamicPattern } from "tinyglobby";
import picomatch from "picomatch";

// Next 16.3.8 uses only globSync(string, { onlyDirectories: true }).
// This is deliberately not a replacement for fast-glob's full API.
export function globSync(pattern, options) {
  if (
    typeof pattern !== "string" ||
    options?.onlyDirectories !== true ||
    Object.keys(options).some((key) => key !== "onlyDirectories")
  ) {
    throw new TypeError("Unsupported Next ESLint directory glob API");
  }

  const dynamic = isDynamicPattern(pattern);
  const base = picomatch.scan(pattern).base.replace(/\/$/, "") || ".";
  return tinyGlobSync(pattern, {
    onlyDirectories: true,
    expandDirectories: false,
    absolute: path.isAbsolute(pattern),
  })
    .map((directory) => directory.replace(/\/$/, ""))
    // fast-glob walks the contents of the static base for dynamic patterns;
    // tinyglobby also includes that base for a trailing globstar.
    .filter((directory) => !dynamic || directory !== base);
}
