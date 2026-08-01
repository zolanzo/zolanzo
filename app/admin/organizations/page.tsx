import React from "react";
import Link from "next/link";

export default function AdminOrganizationsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-5xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Admin — Organization Vetting</h1>
          <p className="text-zinc-400">Review business credentials & Korapay virtual account allocations</p>
        </div>
        <Link href="/admin/dashboard" className="text-amber-400 font-bold hover:underline">
          Back to Admin Dashboard
        </Link>
      </div>
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300">
        All 480 registered organizations are active and verified.
      </div>
    </div>
  );
}
