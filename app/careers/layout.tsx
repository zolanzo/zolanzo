import type { ReactNode } from "react";
import { buildPageMetadata } from "@/components/seo/build-metadata";

export const metadata = buildPageMetadata({
  title: "Careers",
  description: "Careers at ZOLANZO.",
  path: "/careers",
  noIndex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
