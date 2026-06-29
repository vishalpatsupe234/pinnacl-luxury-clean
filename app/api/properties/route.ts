import fs from "fs/promises";
import path from "path";

type PropertyItem = {
  id?: string;
  slug?: string;
  title?: string;
  name?: string;
  type?: string;
  status?: string;
  price?: number;
  location?: {
    area?: string;
    city?: string;
    address?: string;
    [key: string]: unknown;
  };
  highlights?: string[];
  [key: string]: unknown;
};

// Increase TTL to 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { ts: number; data: PropertyItem[] | null } | null = null;

async function readDataFile(): Promise<PropertyItem[]> {
  const now = Date.now();
  if (cache && (now - cache.ts) < CACHE_TTL_MS && cache.data) {
    return cache.data;
  }

  const file = path.join(process.cwd(), "data", "properties.json");
  const raw = await fs.readFile(file, "utf8");
  const obj = JSON.parse(raw) as unknown;
  const items: PropertyItem[] = Array.isArray(obj)
    ? (obj as PropertyItem[])
    : typeof obj === "object" && obj !== null && "items" in obj && Array.isArray((obj as { items?: unknown }).items)
      ? ((obj as { items?: PropertyItem[] }).items ?? [])
      : [];
  cache = { ts: now, data: items };
  return items;
}

function toNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getPropertyStatus(item: PropertyItem): string {
  const status = typeof item.status === "string" ? item.status.trim() : "";
  return status || "Available";
}

function matchesSearch(item: PropertyItem, term: string): boolean {
  const haystack = [
    item.title,
    item.name,
    item.slug,
    item.type,
    item.location?.area,
    item.location?.city,
    item.location?.address,
    Array.isArray(item.highlights) ? item.highlights.join(" ") : "",
    item.id,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return haystack.includes(term.toLowerCase());
}

export async function GET(req: Request) {
  const t0 = Date.now();
  let readMs = 0;
  let filterMs = 0;
  let extMs = 0;

  try {
    const tA = Date.now();
    const items = await readDataFile();
    readMs = Date.now() - tA;

    const tB = Date.now();
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const search = url.searchParams.get("search") ?? url.searchParams.get("q") ?? "";
    const type = url.searchParams.get("type") ?? "";
    const loc = url.searchParams.get("loc") ?? "";
    const min = toNumber(url.searchParams.get("min"));
    const max = toNumber(url.searchParams.get("max"));
    const budget = toNumber(url.searchParams.get("budget"));
    const status = url.searchParams.get("status") ?? "";
    const effectiveMax = max ?? budget;
    let body: PropertyItem | PropertyItem[] | Record<string, unknown>;

    if (slug) {
      const result = items.find((i) => i && (i.slug === slug || i.id === slug));
      body = (result ?? {}) as PropertyItem;
    } else {
      const filtered = items.filter((item) => {
        const itemType = typeof item.type === "string" ? item.type : "";
        const itemLocation = [item.location?.area, item.location?.city, item.location?.address]
          .filter((value): value is string => typeof value === "string")
          .join(" ")
          .toLowerCase();
        const itemPrice = typeof item.price === "number" ? item.price : Number(item.price ?? 0);
        const itemStatus = getPropertyStatus(item).toLowerCase();

        if (search && !matchesSearch(item, search)) {
          return false;
        }

        if (type && !itemType.toLowerCase().includes(type.toLowerCase())) {
          return false;
        }

        if (loc && !itemLocation.includes(loc.toLowerCase())) {
          return false;
        }

        if (min !== null && itemPrice < min) {
          return false;
        }

        if (effectiveMax !== null && itemPrice > effectiveMax) {
          return false;
        }

        if (status && itemStatus !== status.toLowerCase()) {
          return false;
        }

        return true;
      });

      body = filtered;
    }
    filterMs = Date.now() - tB;

    const tC = Date.now();
    extMs = Date.now() - tC;

    const total = Date.now() - t0;

    console.log(
      `API timings: total=${total}ms read=${readMs}ms filter=${filterMs}ms external=${extMs}ms cacheAge=${cache?.ts ? (Date.now() - cache.ts) : "nocache"}ms`
    );

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": `public, max-age=${Math.round(CACHE_TTL_MS / 1000)}`
      }
    });

  } catch (err) {
    const total = Date.now() - t0;
    console.error("API error:", err);

    console.log(
      `API timings (error): total=${total}ms read=${readMs}ms filter=${filterMs}ms external=${extMs}ms`
    );

    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
