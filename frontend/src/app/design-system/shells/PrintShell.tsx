import React from "react";
import { cn } from "../../lib/utils";

/** A4 print-friendly shell for invoices / receipts / vouchers. */
export function PrintShell({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("print-shell bg-white text-black min-h-screen", className)}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-shell, .print-shell * { visibility: visible !important; }
          .print-shell { position: absolute; left: 0; top: 0; width: 100%; }
          .print-shell .no-print { display: none !important; }
        }
        .print-shell .print-page {
          width: 210mm;
          max-width: 100%;
          min-height: 297mm;
          margin: 0 auto;
          padding: 16mm;
          box-sizing: border-box;
        }
      `}</style>
      {title && <title>{title}</title>}
      <div className="print-page">{children}</div>
    </div>
  );
}
