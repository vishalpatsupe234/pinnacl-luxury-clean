// app/api/leads/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Example body: { name, phone, email, message, propertyId }
    console.log("NEW LEAD:", body);

    // TODO: save to DB or call webhook (CRM / WhatsApp)
    // e.g., await fetch(CRM_WEBHOOK, { method: "POST", body: JSON.stringify(body) })

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("lead error", err);
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
}
