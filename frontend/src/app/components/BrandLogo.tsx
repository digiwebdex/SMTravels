import React, { useState } from "react";
import { cn } from "../lib/utils";

/**
 * The one brand mark used everywhere (public nav, drawers, footer, auth, ERP).
 *
 * Renders /logo.png (drop the original artwork at frontend/public/logo.png —
 * full lockup: globe+plane, "SM Travels", "International"). Until that file
 * exists, gracefully falls back to the lettermark tile so nothing breaks.
 *
 *  - variant "full":  the complete lockup image on light backgrounds.
 *  - variant "tile":  square white tile with the mark inside — for dark
 *                     backgrounds (footer / auth panel / ERP sidebar) where
 *                     the light-background artwork needs its own surface.
 */
export function BrandLogo({
  variant = "full",
  className,
  imgClassName,
}: {
  variant?: "full" | "tile";
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (variant === "tile") {
    return (
      <div className={cn("bg-white rounded-[10px] flex items-center justify-center overflow-hidden flex-shrink-0", className)}>
        {failed ? (
          <span className="text-[#1B75BC] font-black text-[13px]">SM</span>
        ) : (
          <img src="/logo.png" alt="SM Travels International" className={cn("w-full h-full object-contain p-0.5", imgClassName)} onError={() => setFailed(true)} />
        )}
      </div>
    );
  }

  if (failed) {
    // fallback lockup (pre-logo-file): tile + wordmark, logo-accurate colors
    return (
      <span className={cn("flex items-center gap-2.5", className)}>
        <span className="w-9 h-9 bg-[#1B75BC] rounded-[10px] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-[12px]">SM</span>
        </span>
        <span className="leading-none">
          <span className="block text-[15px] font-black tracking-tight">
            <span className="text-[#F15A24]">SM</span> <span className="text-[#1B75BC]">Travels</span>
          </span>
          <span className="block text-[9px] text-[#16395C] tracking-[0.18em] font-semibold mt-0.5">INTERNATIONAL</span>
        </span>
      </span>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="SM Travels International"
      className={cn("object-contain", className, imgClassName)}
      onError={() => setFailed(true)}
    />
  );
}
