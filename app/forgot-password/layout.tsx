import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/components/seo/build-metadata";

export const metadata = buildNoIndexMetadata("/forgot-password", "Forgot password");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
