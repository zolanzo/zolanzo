import { redirect } from "next/navigation";

/** Product recovery is PIN reset, not a mock password form. */
export default function ResetPasswordRedirectPage() {
  redirect("/forgot-pin");
}
