"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubmissionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/applications");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm font-semibold text-foreground">
      Redirecting to Applications...
    </div>
  );
}
