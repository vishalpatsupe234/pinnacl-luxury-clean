"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

interface HeroMediaProps {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
  playbackRate?: number;
}

export default function HeroMedia({ type, src, alt = "", poster, playbackRate }: HeroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && playbackRate) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  if (type === "video") {
    return (
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        // "metadata", not "auto": the source file is ~24.4 MB and is served
        // with Cache-Control: max-age=0, must-revalidate, so preload="auto"
        // began fetching the whole asset on every homepage visit — including
        // on mobile data, where it is the single worst thing about the page.
        // "metadata" fetches only enough to know duration/dimensions; the
        // poster still paints immediately, so the visual design is unchanged.
        //
        // This is the cheap half of the fix. The file itself still needs
        // re-encoding to roughly 4 MB or less; no encoder is available in this
        // repository, so that remains outstanding.
        preload="metadata"
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
      priority
      fill
      sizes="100vw"
      quality={75}
    />
  );
}
