import type { ReactNode } from "react";
import { Navbar } from "@/components/navigation/navbar";
import { HomeFooter } from "@/components/home/home-footer";

type MarketingPageProps = {
  title: string;
  intro: string;
  children: ReactNode;
  contentWidthClassName?: string;
};

export function MarketingPage({
  title,
  intro,
  children,
  contentWidthClassName = "max-w-3xl",
}: MarketingPageProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background font-sans text-foreground">
      <Navbar />
      <main className="flex-1">
        <section className="w-full border-b border-border bg-background py-8 sm:py-12">
          <div className={`mx-auto px-4 sm:px-8 ${contentWidthClassName}`}>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <div className="mt-1.5 h-1 w-12 rounded-full bg-primary" />
            <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
              {intro}
            </p>
            <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground sm:text-base">
              {children}
            </div>
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}

export function MarketingSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
        {title}
      </h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}
