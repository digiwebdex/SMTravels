import { readFileSync } from "node:fs";
import { join } from "node:path";

/** App version, read from package.json at runtime (dist/lib -> ../../package.json). */
function readVersion(): string {
  try {
    const raw = readFileSync(join(__dirname, "..", "..", "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export const APP_VERSION = readVersion();
