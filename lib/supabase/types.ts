// Hand-written Database types matching supabase/migrations/.
//
// NOT generated via `supabase gen types typescript` — no Supabase
// CLI/Docker is available in this environment to introspect the
// live remote schema. Keep this file in sync manually whenever the
// schema changes, or regenerate it properly once the CLI is
// available:
//   supabase gen types typescript --project-id <ref> > lib/supabase/types.ts
//
// Tables typed in detail: profiles, invites (broker-auth work),
// and properties, builders (Property Listings module). leads,
// site_visits, deals, commission_ledger, audit_log remain out of
// scope and typed generically so this file still compiles against
// the real schema without claiming knowledge of columns no task
// has touched yet.
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
      // Out of scope for this task — see supabase/migrations/ for
      // the real schema of these tables.
      leads: GenericTable;
      site_visits: GenericTable;
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
