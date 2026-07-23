import React, { useState } from "react";

/**
 * Full-bleed hero background: a muted, looping Makkah video with graceful
 * fallbacks so the hero always looks intentional regardless of what's present.
 *
 * Layering (bottom → top):
 *   1. <img> poster — the Kaaba still (remote Unsplash today). Always renders,
 *      so even with no video/poster file the hero shows real imagery.
 *   2. <video> — /hero-makkah.mp4 with /hero-makkah-poster.jpg as its poster.
 *      Autoplays muted+looping (required for mobile autoplay). If the file is
 *      absent or fails to decode, onError hides it and the <img> shows through.
 *
 * Drop the footage at frontend/public/hero-makkah.mp4 (+ optional
 * hero-makkah-poster.jpg). Runtime-fetched — no rebuild needed when it lands.
 */
export function HeroBackground({ posterImg, alt }: { posterImg: string; alt: string }) {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* poster / fallback still — always present beneath the video */}
      <img src={posterImg} alt={alt} className="absolute inset-0 w-full h-full object-cover" />

      {!videoFailed && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero-makkah-poster.jpg"
          onError={() => setVideoFailed(true)}
        >
          <source src="/hero-makkah.mp4" type="video/mp4" />
        </video>
      )}

      {/* Cinematic scrim: dark top & bottom for text legibility, lighter middle
          so the footage stays visible — a subtle brand-blue tint, not a flat wash. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A2E4D]/80 via-[#0A2E4D]/45 to-[#0A2E4D]/90" />
      <div className="absolute inset-0 bg-[#1B75BC]/15" />
    </div>
  );
}
