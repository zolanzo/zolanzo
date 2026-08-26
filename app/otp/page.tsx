import { redirect } from "next/navigation";

/** Product verification is /verify-email, not this leftover mock OTP screen. */
export default function OtpRedirectPage() {
  redirect("/verify-email");
}
