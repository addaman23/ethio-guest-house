export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function citySlug(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function cityFromSlug(slug: string, cities: string[]): string | null {
  const normalized = slug.trim().toLowerCase();
  return cities.find((c) => citySlug(c) === normalized) ?? null;
}
