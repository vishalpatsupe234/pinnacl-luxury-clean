// app/api/properties/route.ts

import { NextResponse } from "next/server";
import { properties } from "@/lib/properties";

export function GET(request) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get("type"); // residential / commercial
  const location = searchParams.get("location");

  let results = properties;

  if (type) results = results.filter((p) => p.type === type);

  if (location)
    results = results.filter((p) =>
      p.location.toLowerCase().includes(location.toLowerCase())
    );

  return NextResponse.json(results);
}
