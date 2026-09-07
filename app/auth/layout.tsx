import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/components/seo/build-metadata";

export const metadata = buildNoIndexMetadata("/auth", "Account");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
