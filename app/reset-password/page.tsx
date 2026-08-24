"use client";

import React, { useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md space-y-6 text-xs">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-bold tracking-tight">Set New Password</h1>
          <p className="text-muted-foreground">Choose a secure password for your ZOLANZO account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-semibold text-foreground">New Password</label>
            <input
              required
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-input-background px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <button type="submit" className="primary-action min-h-[44px] w-full rounded-xl py-3 text-xs font-bold">
            Update Password & Login
          </button>
        </form>
      </div>
    </div>
  );
}
