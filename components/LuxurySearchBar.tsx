"use client";

export default function LuxurySearchBar() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className="
        flex items-center
        bg-white/10
        backdrop-blur-xl
       border border-[#d6c29a]/30
        rounded-full
        overflow-hidden
        shadow-[0_8px_40px_rgba(0,0,0,0.35)]
      "
      >
        <input
          type="text"
          placeholder="Search by Location, Project or Builder"
          className="
            flex-1
            bg-transparent
            px-8
            py-5
            text-white
            text-lg
            placeholder:text-gray-300
            outline-none
          "
        />

        <button
          className="
            bg-[#d6c29a]
            text-black
            font-semibold
            px-10
            py-5
            hover:opacity-90
            transition
          "
        >
          Search
        </button>
      </div>
    </div>
  );
}