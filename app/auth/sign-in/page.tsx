import { redirect } from "next/navigation";

function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
    return value[0];
  }
  return undefined;
}

/** Product login is PIN + email at /login, not the leftover password form. */
export default async function SignInRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  const next = firstQueryValue(params.next);
  const error = firstQueryValue(params.error);
  const email = firstQueryValue(params.email);
  if (next?.startsWith("/") && !next.startsWith("//")) qs.set("next", next);
  if (error) qs.set("error", error);
  if (email) qs.set("email", email);
  const suffix = qs.toString();
  redirect(suffix ? `/login?${suffix}` : "/login");
}
