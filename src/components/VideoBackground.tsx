"use client";

import { useEffect, useRef, useState } from "react";

export default function VideoBackground() {
  const ref = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onErr = () => setHasVideo(false);
    v.addEventListener("error", onErr);

    const onVisibility = () => {
      if (document.hidden) v.pause();
      else v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      v.removeEventListener("error", onErr);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <div className="video-bg-fallback" aria-hidden />
      {hasVideo && (
        <video
          ref={ref}
          className="video-bg"
          src="/wallpaper.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden
        />
      )}
      <div className="video-bg-overlay" aria-hidden />
    </>
  );
}
