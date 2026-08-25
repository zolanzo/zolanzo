import { redirect } from "next/navigation";

/** Product recovery is PIN + branded ZOLANZO email, not GoTrue password mail. */
export default function AuthForgotPasswordRedirect() {
  redirect("/forgot-pin");
}
