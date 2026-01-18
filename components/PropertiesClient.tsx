"use client";

import { Suspense } from "react";
import PropertiesList from "./PropertiesList";

type Props = {
  initialItems: any[];
};

export default function PropertiesClient({ initialItems }: Props) {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading properties…</div>}>
      <PropertiesList initialItems={initialItems} />
    </Suspense>
  );
}
