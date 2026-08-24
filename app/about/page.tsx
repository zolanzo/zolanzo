import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-background p-6 text-center text-foreground">
      <h1 className="text-2xl font-bold">About ZOLANZO</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Placeholder for About page.</p>
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        Back to Home
      </Link>
    </div>
  );
}
