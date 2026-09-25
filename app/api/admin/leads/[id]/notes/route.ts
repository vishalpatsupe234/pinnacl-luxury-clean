import { NextResponse } from "next/server";
import { serverErrorResponse } from "@/lib/api/serverErrorResponse";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lead_notes")
      .select("id, note, author_id, created_at")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return serverErrorResponse("ADMIN LEAD NOTES LIST ERROR:", error);
    }

    return NextResponse.json({ notes: data });
  } catch (error) {
    return serverErrorResponse("ADMIN LEAD NOTES LIST ERROR:", error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!note) {
      return NextResponse.json({ error: "Note text is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("lead_notes").insert({
      lead_id: id,
      author_id: user.id,
      note,
    });

    if (error) {
      return serverErrorResponse("ADMIN LEAD NOTE CREATE ERROR:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverErrorResponse("ADMIN LEAD NOTE CREATE ERROR:", error);
  }
}
