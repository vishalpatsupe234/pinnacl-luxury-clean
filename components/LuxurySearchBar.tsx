"use client";

export default function LuxurySearchBar() {
  return (
    <div className="
      flex items-center gap-3
      bg-white/95 backdrop-blur-xl
      rounded-full px-4 py-3
      shadow-2xl
      w-full max-w-2xl
    ">
      {/* Toggle */}
      <div className="flex bg-neutral-100 rounded-full p-1 text-xs">
        <button className="px-4 py-1.5 rounded-full bg-black text-white">
          Residential
        </button>
        <button className="px-4 py-1.5 text-neutral-600">
          Commercial
        </button>
      </div>

      {/* Input */}
      <input
        type="text"
        placeholder="e.g. Powai, Thane, BKC"
        className="
          flex-1 bg-transparent outline-none
          text-sm text-neutral-800
          placeholder:text-neutral-400
        "
      />

      {/* Search */}
      <button className="
        px-5 py-2 rounded-full
        bg-[#C9A66A] text-black
        text-sm font-medium
      ">
        Search
      </button>
    </div>
  );
}
