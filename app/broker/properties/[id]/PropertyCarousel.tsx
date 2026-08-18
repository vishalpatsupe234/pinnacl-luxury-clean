"use client";

import { useState } from "react";

export default function PropertyCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-white border border-brand-border flex items-center justify-center">
        <p className="text-xs uppercase tracking-[0.15em] text-brand-muted">No Images</p>
      </div>
    );
  }

  function prev() {
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }

  function next() {
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div>
      <div className="relative aspect-[4/3] bg-white border border-brand-border overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index]} alt={alt} className="w-full h-full object-cover" />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 text-brand-black hover:bg-white transition-colors"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 text-brand-black hover:bg-white transition-colors"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === index ? "bg-brand-gold" : "bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto mt-4">
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setIndex(i)}
              className={`w-20 h-16 flex-shrink-0 border transition-colors ${
                i === index ? "border-brand-gold" : "border-brand-border"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
