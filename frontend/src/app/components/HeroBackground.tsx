import React, { useState } from "react";

/**
 * Full-bleed hero background: a muted, looping Makkah video with graceful
 * fallbacks so the hero always looks intentional regardless of what's present.
 *
 * Layering (bottom → top):
 *   1. <img> poster — always renders for instant first paint.
 *   2. <video> — /hero-makkah.mp4 (web-optimized H.264 720p@24fps).
 *      Autoplays muted+looping. If decode fails, onError hides it.
 *
 * Playback notes: ken-burns is NOT applied to the <video> (causes jank).
 * Drop replacements at frontend/public/hero-makkah.mp4 (+ poster jpg).
 */
export function HeroBackground({ posterImg, alt }: { posterImg: string; alt: string }) {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* poster / fallback still — always present beneath the video */}
      <img
        src={posterImg || "/hero-makkah-poster.jpg"}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
      />

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

      {/* Cinematic scrim: readable text, sacred image still vivid. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#061828]/75 via-[#0A2E4D]/28 to-[#061828]/88" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061828]/25 via-transparent to-[#061828]/20" />
      <div className="absolute inset-0 bg-[#1B75BC]/08" />
    </div>
  );
}
