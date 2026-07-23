#!/usr/bin/env node
/**
 * Guard against the exact failure mode that broke the frontend build:
 * a RUNTIME (value) import from "@contracts/..." — the alias exists only in
 * tsconfig for type-checking, not in vite.config.ts, so `import type` erases
 * fine but any value import is unresolvable at bundle time.
 *
 *   1. FAIL on any non-type import from @contracts anywhere in frontend/src.
 *   2. FAIL if the shared DOCUMENT_TYPES list has drifted from the backend
 *      contract's copy (the two files cross-reference each other).
 *
 * Runs from the repo pre-commit hook (.githooks/pre-commit) and as
 * `npm run check:imports` in frontend/. Zero dependencies.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FRONTEND_SRC = resolve(here, "../src");
const REPO_ROOT = resolve(here, "../..");

let failures = 0;
const fail = (msg) => { failures++; console.error(`✗ ${msg}`); };

// ── 1) value imports from @contracts ─────────────────────────────────────────
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(name)) yield p;
  }
}

// Matches: import { X } from "@contracts/..."  and  import X from "@contracts/..."
// Skips:   import type { ... }  (fully erased — safe)
// Flags:   mixed imports (import { VALUE, type T }) — the value part still bundles.
const importRe = /import\s+(type\s+)?([^;]*?)\s+from\s+["']@contracts\/[^"']+["']/g;

for (const file of walk(FRONTEND_SRC)) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(importRe)) {
    const [whole, typeKw, clause] = m;
    if (typeKw) continue; // `import type { ... }` — erased, fine
    // inner `type` on every specifier (import { type A, type B }) is also fine
    const specifiers = clause.replace(/^\{|\}$/g, "").split(",").map((s) => s.trim()).filter(Boolean);
    const valueSpecifiers = specifiers.filter((s) => !s.startsWith("type "));
    if (valueSpecifiers.length > 0) {
      fail(
        `${file.replace(REPO_ROOT + "/", "")}: RUNTIME import from @contracts (` +
          `${valueSpecifiers.join(", ")}) — @contracts has no vite alias; move the value ` +
          `into a dependency-free module under frontend/src (see lib/documentTypes.ts) ` +
          `and keep only \`import type\` from @contracts.\n    ${whole.trim()}`,
      );
    }
  }
}

// ── 2) DOCUMENT_TYPES drift check ────────────────────────────────────────────
function extractList(path) {
  const src = readFileSync(path, "utf8");
  const m = src.match(/DOCUMENT_TYPES\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!m) return null;
  return [...m[1].matchAll(/["']([A-Z_]+)["']/g)].map((x) => x[1]);
}
const feList = extractList(resolve(FRONTEND_SRC, "app/lib/documentTypes.ts"));
const beList = extractList(resolve(REPO_ROOT, "backend/src/contracts/document.contract.ts"));
if (!feList || !beList) {
  fail("could not extract DOCUMENT_TYPES from one of its two source files (regex drift?)");
} else if (JSON.stringify(feList) !== JSON.stringify(beList)) {
  fail(
    `DOCUMENT_TYPES drift:\n    frontend/src/app/lib/documentTypes.ts: ${feList.join(", ")}\n` +
    `    backend/src/contracts/document.contract.ts: ${beList.join(", ")}`,
  );
}

if (failures > 0) {
  console.error(`\ncheck-contracts-imports: ${failures} problem(s) — commit blocked.`);
  process.exit(1);
}
console.log("check-contracts-imports: OK (no runtime @contracts imports; DOCUMENT_TYPES in sync)");
