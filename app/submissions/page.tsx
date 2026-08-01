"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubmissionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/applications");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#04090B] text-white flex items-center justify-center text-sm font-semibold">
      Redirecting to Applications...
    </div>
  );
}
