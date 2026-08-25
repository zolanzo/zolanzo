import { redirect } from "next/navigation";

/** Product recovery is PIN + branded ZOLANZO email, not a GoTrue password form. */
export default function UpdatePasswordRedirect() {
  redirect("/forgot-pin");
}
