import { NextResponse } from "next/server";
import { serverErrorResponse } from "@/lib/api/serverErrorResponse";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import type { Database } from "@/lib/supabase/types";

type Params = { params: Promise<{ id: string }> };
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

// Admin can edit any lead field, assign/reassign a broker, and
// change the pipeline stage — all via the existing leads RLS.
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const update: LeadUpdate = {};
    if (typeof body.buyer_name === "string") update.buyer_name = body.buyer_name.trim();
    if ("buyer_phone" in body) update.buyer_phone = body.buyer_phone || null;
    if ("buyer_email" in body) update.buyer_email = body.buyer_email || null;
    if ("message" in body) update.message = body.message || null;
    if ("property_id" in body) update.property_id = body.property_id || null;
    if ("assigned_broker_id" in body) update.assigned_broker_id = body.assigned_broker_id || null;
    if ("status" in body) update.status = body.status;

    const supabase = await createClient();
    const { error } = await supabase.from("leads").update(update).eq("id", id);

    if (error) {
      return serverErrorResponse("ADMIN LEAD UPDATE ERROR:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverErrorResponse("ADMIN LEAD UPDATE ERROR:", error);
  }
}
