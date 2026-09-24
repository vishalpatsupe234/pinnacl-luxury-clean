import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { publicPropertySurfacesEnabled } from "@/lib/compliance/publicMode";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pre-registration mode: advertise no property URLs at all, and do not
  // query inventory to build them. Also drops the /properties index, which
  // currently serves only a holding notice.
  const propertySurfacesEnabled = publicPropertySurfacesEnabled();

  let properties: MetadataRoute.Sitemap = [];

  if (propertySurfacesEnabled) {
    // Explicit filters, not RLS alone: policies are OR'd, so an admin/broker session can also read unapproved or soft-deleted rows.
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("slug, updated_at")
      .eq("approval_status", "approved")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("sitemap: failed to load properties from Supabase:", error);
    }

    properties = (data ?? []).map((property) => ({
      url: `${siteUrl}/properties/${property.slug}`,
      lastModified: new Date(property.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  }

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // /projects redirects to /properties, so both are listed only while
    // property surfaces are actually serving inventory.
    ...(propertySurfacesEnabled
      ? [
          {
            url: `${siteUrl}/projects`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.9,
          },
          {
            url: `${siteUrl}/properties`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.95,
          },
        ]
      : []),
    ...properties,
  ];
}
