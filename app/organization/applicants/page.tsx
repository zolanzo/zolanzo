import React from "react";
import Link from "next/link";

export default function OrganizationApplicantsPage() {
  const applicants = [
    { name: "Kwame Mensah", country: "Ghana 🇬🇭", rating: "4.9 ★", completed: "142 Tasks", status: "Approved for Campaign" },
    { name: "Amina Bello", country: "Nigeria 🇳🇬", rating: "5.0 ★", completed: "210 Tasks", status: "Approved for Campaign" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-5xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Worker Applicants & Talent Queue</h1>
          <p className="text-zinc-400">Manage worker deployments and performance scores</p>
        </div>
        <Link href="/organization/dashboard" className="text-emerald-400 font-bold hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-3">
        {applicants.map((a) => (
          <div key={a.name} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-zinc-200">{a.name} ({a.country})</div>
              <div className="text-[10px] text-zinc-400">Rating: {a.rating} • {a.completed}</div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
