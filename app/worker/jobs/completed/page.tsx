import React from "react";
import Link from "next/link";
import { BrandIcon, BrandType } from "@/components/ui/brand-icons";

export default function CompletedJobsPage() {
  const completed = [
    { title: "AI Image Dataset Tagging", pay: "+$5.00", brand: "google" as BrandType, date: "Today, 10:15 AM", status: "Approved" },
    { title: "WhatsApp Support Survey", pay: "+$3.20", brand: "whatsapp" as BrandType, date: "Yesterday", status: "Approved" },
    { title: "TikTok Video Tagging & Captions", pay: "+$6.00", brand: "tiktok" as BrandType, date: "July 28", status: "Approved" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-5xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Completed & Approved Tasks</h1>
          <p className="text-zinc-400">History of approved tasks and payouts released from escrow</p>
        </div>
        <Link href="/worker/dashboard" className="text-emerald-400 font-bold hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-3">
        {completed.map((item) => (
          <div key={item.title} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandIcon brand={item.brand} size={36} background="soft" />
              <div>
                <div className="font-bold text-sm text-zinc-200">{item.title}</div>
                <div className="text-[10px] text-zinc-400">{item.date} • Status: {item.status}</div>
              </div>
            </div>
            <div className="text-base font-extrabold text-emerald-400">{item.pay}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
