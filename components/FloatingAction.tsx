"use client";

import { FaRegComments } from "react-icons/fa";

export default function FloatingAction() {
  return (
    <a
      href="https://wa.me/919146238303?text=Hi,%20I%20want%20to%20explore%20the%20property.%20Please%20share%20details%20and%20schedule%20a%20site%20visit."
      target="_blank"
      rel="noopener noreferrer"
      className="
        fixed z-[999]
        w-[52px] h-[52px] md:w-14 md:h-14
        bottom-4 right-4 md:bottom-6 md:right-6
        rounded-full
        flex items-center justify-center
        bg-brand-gold
        text-brand-black
        hover:-translate-y-0.5 transition-transform duration-180 ease-out
      "
    >
      <FaRegComments size={24} className="md:w-7 md:h-7" />
    </a>
  );
}
