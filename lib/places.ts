export function toPlaces(items: unknown, kind: string) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => {
      const value = typeof item === "string" ? { name: item } : (item as { name?: string; note?: string });
      return {
        kind,
        name: String(value.name || "").trim(),
        note: String(value.note || "").trim(),
        sortOrder: index
      };
    })
    .filter((item) => item.name);
}
