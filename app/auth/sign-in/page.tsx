import { Suspense } from "react";
import SignInClient from "./sign-in-client";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <SignInClient />
    </Suspense>
  );
}
