import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Navbar } from "@/components/navigation/navbar";
import { HomeFooter } from "@/components/home/home-footer";
import { FaqAccordion } from "@/components/faq/faq-accordion";
import { FAQ_GROUPS } from "@/components/faq/faq-content";
import { WhatsAppSupportLink } from "@/components/support/whatsapp-support-link";
import { buildPageMetadata } from "@/components/seo/build-metadata";

export const metadata = buildPageMetadata({
  title: "FAQ",
  description:
    "Answers to common questions about how ZOLANZO works, including tasks, earnings, hiring, and support.",
  path: "/faq",
});

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background font-sans text-foreground">
      <Navbar />

      <main className="flex-1">
        <section className="w-full border-b border-border bg-background py-8 sm:py-12">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
            <div className="mb-8 text-center sm:mb-10">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Frequently Asked Questions
              </h1>
              <div className="mx-auto mt-1.5 h-1 w-12 rounded-full bg-primary" />
              <p className="mx-auto mt-3 max-w-[620px] text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
                Quick answers to help you understand how ZOLANZO works.
              </p>
            </div>

            <FaqAccordion groups={FAQ_GROUPS} />

            <div className="mx-auto mt-10 flex max-w-[800px] flex-col items-center gap-3 border-t border-border pt-8">
              <p className="text-sm font-medium text-muted-foreground">Still need help?</p>
              <WhatsAppSupportLink />
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
              >
                Contact ZOLANZO
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
