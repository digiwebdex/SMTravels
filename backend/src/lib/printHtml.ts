/** Lightweight HTML printable pages — no PDF library required. */

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printPage(title: string, body: string): string {
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${safeTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #111827; background: #fff; padding: 24px; }
    .sheet { max-width: 720px; margin: 0 auto; }
    .stripe { height: 4px; border-radius: 4px 4px 0 0; background: linear-gradient(90deg, #1B75BC 0%, #F15A24 100%); }
    .card { border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; }
    .inner { padding: 32px; }
    .brand { font-size: 22px; font-weight: 800; color: #1B75BC; }
    .sub { font-size: 11px; color: #6B7280; margin-top: 4px; }
    .doc-type { font-size: 28px; font-weight: 800; color: rgba(17,24,39,.08); text-align: right; letter-spacing: .04em; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .box { background: #F9FAFB; border-radius: 10px; padding: 14px 16px; }
    .box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #9CA3AF; margin-bottom: 8px; }
    .amount { font-size: 28px; font-weight: 800; color: #1B75BC; font-variant-numeric: tabular-nums; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td { padding: 8px 0; font-size: 13px; border-bottom: 1px solid #F3F4F6; vertical-align: top; }
    td:first-child { color: #6B7280; width: 38%; }
    td:last-child { font-weight: 600; text-align: right; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px dashed #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: center; }
    .status { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #ECFDF5; color: #047857; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="card">
      <div class="stripe"></div>
      <div class="inner">${body}</div>
    </div>
    <p class="footer no-print">Use your browser&apos;s Print dialog to save as PDF or print.</p>
  </div>
  <script>window.addEventListener("load", function(){ setTimeout(function(){ window.print(); }, 300); });</script>
</body>
</html>`;
}

export function fmtMoney(amount: number, currency: string): string {
  const sym = currency === "BDT" ? "৳" : currency + " ";
  return `${sym} ${amount.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function fmtDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
