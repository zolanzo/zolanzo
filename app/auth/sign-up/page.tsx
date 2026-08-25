import { redirect } from "next/navigation";

/** Product signup is the PIN + 6-digit ZOLANZO verification flow. */
export default function AuthSignUpRedirect() {
  redirect("/signup");
}
