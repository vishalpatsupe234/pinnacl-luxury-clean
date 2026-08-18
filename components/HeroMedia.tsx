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
        preload="auto"
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
