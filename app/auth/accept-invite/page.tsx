import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import AcceptInviteClient from "./accept-invite-client";

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Spinner label="Loading" />
        </div>
      }
    >
      <AcceptInviteClient />
    </Suspense>
  );
}
