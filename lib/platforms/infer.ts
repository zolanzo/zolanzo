const PLATFORM_NEEDLES: Array<[string, string]> = [
  ["tiktok", "TikTok"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["whatsapp", "WhatsApp"],
  ["telegram", "Telegram"],
  ["threads", "Threads"],
  ["linkedin", "LinkedIn"],
  ["twitter", "X"],
  ["google play", "GooglePlay"],
  ["googleplay", "GooglePlay"],
  ["play store", "GooglePlay"],
  ["website", "Website"],
];

/** Map campaign/template copy onto the shared social icon keys. */
export function inferSocialPlatform(...parts: Array<string | null | undefined>): string {
  const hay = parts.filter(Boolean).join(" ").toLowerCase();
  if (/(^|[^a-z])x([^a-z]|$)/.test(hay) && hay.includes("twitter") === false) {
    if (hay.includes(" x ") || hay.startsWith("x ") || hay.endsWith(" x") || hay === "x") {
      return "X";
    }
  }
  for (const [needle, label] of PLATFORM_NEEDLES) {
    if (hay.includes(needle)) return label;
  }
  if (hay.includes("x_twitter") || hay.includes("twitter")) return "X";
  return "Website";
}

export function formatDurationMin(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return "—";
  if (minutes < 1) return "<1 min";
  return `~${Math.round(minutes)} min`;
}
