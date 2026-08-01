import React from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";

export default function OrganizationProfilePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-4xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Organization Profile</h1>
          <p className="text-zinc-400">Business registration & Korapay settlement details</p>
        </div>
        <Link href="/organization/dashboard" className="text-emerald-400 font-bold hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm">Global Media Corp</h2>
            <p className="text-zinc-400">admin@globalmedia.com • RC-991823</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold">
            <Icons.verified size={14} className="inline mr-1" /> Business Verified
          </span>
        </div>
      </div>
    </div>
  );
}
