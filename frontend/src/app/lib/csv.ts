/**
 * Client-side CSV export used by the "Export" buttons across the ERP.
 * Flattens each row to the first row's columns; objects/arrays are JSON-encoded.
 * No backend needed — builds a Blob and triggers a download.
 */
export function exportCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows || rows.length === 0) return;
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown): string => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
