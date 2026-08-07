import React from "react";
import { cn } from "../lib/utils";

/** Compact payment brand marks for the footer bar. */
export function PaymentLogos({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)} aria-label="Accepted payments">
      {/* Visa */}
      <span className="h-8 px-2.5 rounded bg-white flex items-center justify-center min-w-[52px]" title="Visa">
        <svg viewBox="0 0 48 16" className="h-3.5 w-auto" aria-hidden>
          <path fill="#1A1F71" d="M19.5 1.2h3.4l-2.1 13.6h-3.4L19.5 1.2zm14.2 0c-.7 0-1.2.3-1.5.9l-5.3 12.7h3.6l.7-2.1h4.4l.4 2.1h3.2L36.1 1.2h-2.4zm.4 3.5l1.7 5.1h-2.9l1.2-5.1zM17.2 1.2l-3.4 9.1-.4-1.8c-.6-2.1-2.6-4.4-4.8-5.5l3.1 11.8h3.6L22.1 1.2h-4.9zM8.2 1.2H2.7L2.6 1.5c4.3 1.1 7.1 3.7 8.3 6.9L9.5 1.9c-.2-.5-.6-.7-1.3-.7z" />
        </svg>
      </span>

      {/* Mastercard */}
      <span className="h-8 px-2 rounded bg-white flex items-center justify-center min-w-[48px]" title="Mastercard">
        <svg viewBox="0 0 38 24" className="h-5 w-auto" aria-hidden>
          <circle cx="14" cy="12" r="8" fill="#EB001B" />
          <circle cx="24" cy="12" r="8" fill="#F79E1B" />
          <path fill="#FF5F00" d="M19 5.6a8 8 0 0 1 0 12.8 8 8 0 0 1 0-12.8z" />
        </svg>
      </span>

      {/* bKash */}
      <span className="h-8 px-2.5 rounded bg-white flex items-center justify-center gap-1 min-w-[58px]" title="bKash">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#E2136E" d="M4 4h7.2L20 12l-8.8 8H4l8.8-8L4 4z" />
          <path fill="#E2136E" d="M9.5 8.2 12 12l-2.5 3.8H7.2L9.7 12 7.2 8.2h2.3z" opacity=".85" />
        </svg>
        <span className="text-[11px] font-bold text-[#E2136E] tracking-tight">bKash</span>
      </span>

      {/* Nagad */}
      <span className="h-8 px-2.5 rounded bg-white flex items-center justify-center gap-1 min-w-[58px]" title="Nagad">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#F15A24" />
          <path fill="#fff" d="M7.5 14.5c1.2-3.8 3-6.2 4.5-7.2 1.5 1 3.3 3.4 4.5 7.2h-2.1c-.7-1.8-1.6-3.2-2.4-4-.8.8-1.7 2.2-2.4 4H7.5z" />
        </svg>
        <span className="text-[11px] font-bold text-[#F15A24] tracking-tight">Nagad</span>
      </span>
    </div>
  );
}
