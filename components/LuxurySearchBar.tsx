"use client";

export default function LuxurySearchBar() {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-0">
        <input
          type="text"
          placeholder="Search by location, project or builder"
          className="
            flex-1
            bg-transparent
            border border-white/30
            sm:border-r-0
            px-6
            py-3.5
            text-white
            text-sm
            font-light
            tracking-wide
            placeholder:text-white/40
            outline-none
            transition-colors
            focus:border-white/50
          "
        />

        <button
          className="
            border border-white/50
            bg-transparent
            text-white
            text-xs
            font-light
            uppercase
            tracking-[0.2em]
            px-10
            py-3.5
            whitespace-nowrap
            transition-all
            duration-300
            hover:bg-white/10
            hover:border-white/80
          "
        >
          Explore Properties
        </button>
      </div>
    </div>
  );
}
