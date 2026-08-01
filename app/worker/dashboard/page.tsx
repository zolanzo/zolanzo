"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkerDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/earner/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#04090B] text-white flex items-center justify-center text-sm font-semibold">
      Redirecting to Earn Dashboard...
    </div>
  );
}
