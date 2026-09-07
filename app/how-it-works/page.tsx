import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/components/seo/build-metadata";

export const metadata = buildPageMetadata({
  title: "How It Works",
  description:
    "Earners complete online tasks and get paid after approval. Hirers fund campaigns and review submissions on ZOLANZO.",
  path: "/how-it-works",
  noIndex: true,
});

/** Public nav uses the homepage section; keep a single How It Works surface. */
export default function HowItWorksRedirectPage() {
  redirect("/#how-it-works");
}
