import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { buildNoIndexMetadata } from "@/components/seo/build-metadata";
import { isDevOnlyRoutePublic } from "@/lib/dev/dev-surfaces";

export const metadata = buildNoIndexMetadata("/dev", "Dev");

export default function DevSurfaceLayout({ children }: { children: ReactNode }) {
  if (!isDevOnlyRoutePublic()) {
    notFound();
  }

  return children;
}
