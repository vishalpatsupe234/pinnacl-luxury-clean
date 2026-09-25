import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "../../SignOutButton";
import LeadNotesPanel from "./LeadNotesPanel";

type Params = { params: Promise<{ id: string }> };

export default async function BrokerLeadDetailPage({ params }: Params) {
  const { id } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/broker/login");
  }
  if (!profile || (profile.role !== "verified_broker" && profile.role !== "sales_partner")) {
    redirect("/broker/login");
  }
  if (profile.status !== "active") {
    redirect("/broker/dashboard");
  }

  const supabase = await createClient();

  // RLS (leads_broker_read_assigned) returns nothing if this lead
  // isn't assigned to the current broker — notFound() covers both
  // "doesn't exist" and "not assigned to me" without distinguishing,
  // which is the correct behavior (don't leak existence of leads
  // this broker can't see).
  const { data: lead } = await supabase
    .from("leads")
    .select("id, property_id, buyer_name, buyer_phone, buyer_email, message, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!lead) {
    notFound();
  }

  const { data: notes } = await supabase
    .from("lead_notes")
    .select("id, note, author_id, created_at")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <div className="section-shell py-16 md:py-20">
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/broker/leads"
            className="text-xs uppercase tracking-[0.15em] font-light text-brand-muted hover:text-brand-gold transition-colors duration-300"
          >
            ← My Leads
          </Link>
          <SignOutButton />
        </div>

        <div className="max-w-2xl">
          <p className="section-label mb-2">Lead</p>
          <h1 className="font-serif text-3xl text-brand-black mb-2">{lead.buyer_name}</h1>
          <p className="text-sm font-light text-brand-muted mb-10">
            {[lead.buyer_phone, lead.buyer_email].filter(Boolean).join(" · ") || "—"}
          </p>

          {lead.message && (
            <div className="mb-10 pb-10 border-b border-brand-border">
              <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-2">
                Enquiry
              </p>
              <p className="text-sm font-light text-brand-black leading-relaxed">{lead.message}</p>
            </div>
          )}

          <LeadNotesPanel leadId={lead.id} initialStatus={lead.status} initialNotes={notes ?? []} />
        </div>
      </div>
    </main>
  );
}
