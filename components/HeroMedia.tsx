"use client";

import Image from "next/image";

interface HeroMediaProps {
  type: "image" | "video";
  src: string;
  alt?: string;
}

export default function HeroMedia({ type, src, alt = "" }: HeroMediaProps) {
  if (type === "video") {
    return (
      <video
        src={src}
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
