import { redirect } from "next/navigation";

/** Public nav uses the homepage section; keep a single How It Works surface. */
export default function HowItWorksRedirectPage() {
  redirect("/#how-it-works");
}
