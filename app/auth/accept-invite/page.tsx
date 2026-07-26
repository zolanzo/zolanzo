import { Suspense } from "react";
import AcceptInviteClient from "./accept-invite-client";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <AcceptInviteClient />
    </Suspense>
  );
}
