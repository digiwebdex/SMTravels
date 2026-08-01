import React, { useEffect } from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";
import type { SiteVideo } from "./videos";

export function VideoPlayerModal({
  video, bn, onClose,
}: {
  video: SiteVideo;
  bn: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const title = bn ? video.titleBn : video.titleEn;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={title}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-[#041E42] rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#F15A24]">{video.category}</p>
            <h3 className="text-white font-semibold text-sm md:text-base truncate">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Close video"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative aspect-video bg-black">
          {video.src ? (
            <video
              key={video.src}
              className="w-full h-full"
              controls
              autoPlay
              playsInline
              poster={video.poster}
              src={video.src}
            >
              Your browser does not support the video tag.
            </video>
          ) : video.youtubeId ? (
            <iframe
              title={title}
              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
