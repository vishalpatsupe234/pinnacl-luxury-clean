"use client";

import { FaRegComments } from "react-icons/fa";

export default function FloatingAction() {
  return (
    <a
      href="https://wa.me/919146238303?text=Hi,%20I%20want%20to%20explore%20the%20property.%20Please%20share%20details%20and%20schedule%20a%20site%20visit."
      target="_blank"
      rel="noopener noreferrer"
      className="
        fixed bottom-6 right-6 z-[999]
        px-6 py-3 rounded-full
        flex items-center justify-center
        shadow-[0_6px_20px_rgba(0,0,0,0.3)]
        bg-[radial-gradient(circle_at_0%_0%,#fff6da_0%,#f3d391_32%,#d2a049_100%)]
        border border-white/50
        hover:scale-110 transition
      "
    >
      <FaRegComments size={26} className="text-black" />
    </a>
  );
}
