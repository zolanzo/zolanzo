import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/components/seo/build-metadata";

export const metadata = buildNoIndexMetadata("/verify-email", "Verify email");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
