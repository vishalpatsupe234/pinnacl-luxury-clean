import { NextResponse } from "next/server";

// Logs full error detail server-side only. Admin/broker routes must
// never echo raw Supabase/Postgres/provider error text to the client —
// it can reveal schema, constraint, or trigger names that are internal
// implementation detail, not something to expose over HTTP. Reuses the
// same generic message app/api/leads/route.ts already established.
export function serverErrorResponse(label: string, error: unknown, status = 500) {
  console.error(label, error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status }
  );
}
