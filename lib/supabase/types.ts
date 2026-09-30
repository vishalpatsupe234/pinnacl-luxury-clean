// Hand-written Database types matching supabase/migrations/.
//
// NOT generated via `supabase gen types typescript` — no Supabase
// CLI/Docker is available in this environment to introspect the
// live remote schema. Keep this file in sync manually whenever the
// schema changes, or regenerate it properly once the CLI is
// available:
//   supabase gen types typescript --project-id <ref> > lib/supabase/types.ts
//
// Tables typed in detail: profiles, invites (broker-auth work);
// properties, builders (Property Listings module); leads,
// lead_notes, site_visits (Lead Management CRM). deals,
// commission_ledger, audit_log remain out of scope and typed
// generically so this file still compiles against the real schema
// without claiming knowledge of columns no task has touched yet.
//
// `Relationships: []` is required on every table entry — the
// Supabase/PostgREST query-builder's generic inference collapses
// to `never` on chained `.select()`/`.eq()` calls without it.

export type ProfileRole = "super_admin" | "verified_broker" | "sales_partner" | "viewer";
export type ProfileStatus = "pending_approval" | "active" | "rejected" | "suspended";
export type KycStatus = "pending" | "verified" | "rejected";
export type InviteRole = "verified_broker" | "sales_partner";
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";
export type ProjectStatus = "under_construction" | "ready_to_move" | "sold_out";
export type ApprovalStatus = "pending_review" | "approved" | "rejected";
export type BuilderVerificationStatus = "pending" | "verified" | "rejected";
// The canonical lead pipeline stages, as a runtime value.
//
// Mirrors the leads_status_check constraint in
// supabase/migrations/20260819100000_lead_management_crm.sql exactly:
//   check (status in ('new','contacted','qualified','site_visit',
//                     'negotiation','closed','lost'))
//
// A runtime array rather than a bare type union, because server routes must
// validate an incoming string before it reaches the database — a TypeScript
// union disappears at compile time and cannot check a request body. LeadStage
// is derived from this array, so the type and the runtime whitelist cannot
// drift apart.
//
// This file carries no `server-only` guard and is already imported by client
// components, so a plain const array is safe on both sides of the boundary.
export const LEAD_STAGES = [
  "new",
  "contacted",
  "qualified",
  "site_visit",
  "negotiation",
  "closed",
  "lost",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];

/** Runtime guard for an untrusted `status` value from a request body. */
export function isLeadStage(value: unknown): value is LeadStage {
  return (
    typeof value === "string" &&
    (LEAD_STAGES as readonly string[]).includes(value)
  );
}

// The canonical lead acquisition channels.
//
// Mirrors the leads_lead_source_check constraint in
// supabase/migrations/20260929090000_leads_source_and_response_tracking.sql
// exactly. Same two-layer arrangement as LEAD_STAGES above: this array gives
// the API boundary a clean 400 on a bad value, the CHECK constraint is the
// boundary that cannot be bypassed. Adding a channel means editing both.
//
// NULL (absent) is a legitimate value in the database and means "not
// recorded" — every lead created before 2026-09-29 is NULL, and nothing
// backfills them, because guessing a historical lead's origin would be
// fabricating data.
//
// This is CHANNEL only. Campaign-level attribution (UTM parameters, ad sets,
// keywords) is deliberately not modelled: a website visitor arriving from an
// Instagram ad is recorded as 'website' here, because that is the surface
// they submitted from and it is all the server can honestly observe without
// UTM capture. See the P1 report for why that gap is left open.
export const LEAD_SOURCES = [
  "website",
  "whatsapp",
  "facebook",
  "instagram",
  "google",
  "referral",
  "direct",
  "other",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

/** Runtime guard for an untrusted `lead_source` value from a request body. */
export function isLeadSource(value: unknown): value is LeadSource {
  return (
    typeof value === "string" &&
    (LEAD_SOURCES as readonly string[]).includes(value)
  );
}

/** Human labels for the channels above, for use in admin/broker UI. */
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google",
  referral: "Referral",
  direct: "Direct",
  other: "Other",
};

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: ProfileRole;
          full_name: string | null;
          phone: string | null;
          kyc_status: KycStatus;
          status: ProfileStatus;
          invited_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: ProfileRole;
          full_name?: string | null;
          phone?: string | null;
          kyc_status?: KycStatus;
          status?: ProfileStatus;
          invited_by?: string | null;
        };
        Update: Partial<{
          role: ProfileRole;
          full_name: string | null;
          phone: string | null;
          kyc_status: KycStatus;
          status: ProfileStatus;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          email: string;
          role: InviteRole;
          token: string;
          status: InviteStatus;
          invited_by: string;
          created_profile_id: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          email: string;
          role?: InviteRole;
          token: string;
          invited_by: string;
          expires_at: string;
        };
        Update: Partial<{
          status: InviteStatus;
          created_profile_id: string | null;
          accepted_at: string | null;
        }>;
        Relationships: [];
      };
      builders: {
        Row: {
          id: string;
          name: string;
          contact_email: string | null;
          contact_phone: string | null;
          rera_registration_number: string | null;
          verification_status: BuilderVerificationStatus;
          created_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          rera_registration_number?: string | null;
          verification_status?: BuilderVerificationStatus;
          created_by?: string | null;
        };
        Update: Partial<{
          name: string;
          contact_email: string | null;
          contact_phone: string | null;
          rera_registration_number: string | null;
          verification_status: BuilderVerificationStatus;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          title: string;
          slug: string;
          builder_id: string | null;
          source_broker_id: string;
          rera_number: string | null;
          project_status: ProjectStatus;
          approval_status: ApprovalStatus;
          city: string | null;
          locality: string | null;
          price: number | null;
          price_display: string | null;
          bhk: number | null;
          area_text: string | null;
          description: string | null;
          highlights: string[];
          images: string[];
          is_featured: boolean;
          property_type: string | null;
          bedrooms: number | null;
          bathrooms: number | null;
          area_sqft: number | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          slug: string;
          builder_id?: string | null;
          source_broker_id: string;
          rera_number?: string | null;
          project_status?: ProjectStatus;
          approval_status?: ApprovalStatus;
          city?: string | null;
          locality?: string | null;
          price?: number | null;
          price_display?: string | null;
          bhk?: number | null;
          area_text?: string | null;
          description?: string | null;
          highlights?: string[];
          images?: string[];
          is_featured?: boolean;
          property_type?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          area_sqft?: number | null;
        };
        Update: Partial<{
          title: string;
          slug: string;
          builder_id: string | null;
          rera_number: string | null;
          project_status: ProjectStatus;
          approval_status: ApprovalStatus;
          city: string | null;
          locality: string | null;
          price: number | null;
          price_display: string | null;
          bhk: number | null;
          area_text: string | null;
          description: string | null;
          highlights: string[];
          images: string[];
          is_featured: boolean;
          property_type: string | null;
          bedrooms: number | null;
          bathrooms: number | null;
          area_sqft: number | null;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          property_id: string | null;
          buyer_name: string;
          buyer_phone: string | null;
          buyer_email: string | null;
          message: string | null;
          assigned_broker_id: string | null;
          status: LeadStage;
          lead_source: LeadSource | null;
          assigned_at: string | null;
          contacted_at: string | null;
          next_action_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          property_id?: string | null;
          buyer_name: string;
          buyer_phone?: string | null;
          buyer_email?: string | null;
          message?: string | null;
          assigned_broker_id?: string | null;
          status?: LeadStage;
          lead_source?: LeadSource | null;
        };
        // `assigned_at` is deliberately absent from Insert and Update.
        // It is owned by the leads_assignment_timestamp trigger, which
        // overwrites whatever a caller supplies, so leaving it out of these
        // types turns "application code must not write this column" into a
        // compile-time guarantee rather than a convention.
        Update: Partial<{
          property_id: string | null;
          buyer_name: string;
          buyer_phone: string | null;
          buyer_email: string | null;
          message: string | null;
          assigned_broker_id: string | null;
          status: LeadStage;
          lead_source: LeadSource | null;
          contacted_at: string | null;
          next_action_at: string | null;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      lead_notes: {
        Row: {
          id: string;
          lead_id: string;
          author_id: string;
          note: string;
          created_at: string;
        };
        Insert: {
          lead_id: string;
          author_id: string;
          note: string;
        };
        Update: Partial<{
          note: string;
        }>;
        Relationships: [];
      };
      site_visits: {
        Row: {
          id: string;
          lead_id: string;
          property_id: string;
          broker_id: string;
          visit_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          lead_id: string;
          property_id: string;
          broker_id: string;
          visit_date: string;
          notes?: string | null;
        };
        Update: Partial<{
          notes: string | null;
        }>;
        Relationships: [];
      };
      // Out of scope for this task — see supabase/migrations/ for
      // the real schema of these tables.
      deals: GenericTable;
      commission_ledger: GenericTable;
      audit_log: GenericTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
