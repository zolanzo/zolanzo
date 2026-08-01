import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import SignInClient from "./sign-in-client";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Spinner label="Loading" />
        </div>
      }
    >
      <SignInClient />
    </Suspense>
  );
}
