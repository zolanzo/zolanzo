"use client";

import React, { useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-xs">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold tracking-tight">Set New Password</h1>
          <p className="text-zinc-400">Choose a secure password for your ZOLANZO account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1 text-zinc-300">New Password</label>
            <input
              required
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-all min-h-[44px]"
          >
            Update Password & Login
          </button>
        </form>
      </div>
    </div>
  );
}
