import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, name, phone, message } = body ?? {};

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: "name and phone are required" },
        { status: 400 }
      );
    }

    console.log("NEW ENQUIRY:", { propertyId, name, phone, message });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("enquiry error", error);
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
}
