/** Amounts in the ledger are stored as minor units (kobo). */

export function formatNgnFromMinor(minor: number): string {
  const naira = Number.isFinite(minor) ? minor / 100 : 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira);
}

export function nairaToMinor(naira: number): number {
  if (!Number.isFinite(naira)) return 0;
  return Math.round(naira * 100);
}

export function firstNameFromDisplayName(name: string | null | undefined): string {
  const part = name?.trim().split(/\s+/)[0];
  return part && part.length > 0 ? part : "there";
}

export function initialsFromName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Z";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
}
