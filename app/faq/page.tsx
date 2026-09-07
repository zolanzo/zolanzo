import { Navbar } from "@/components/navigation/navbar";
import { HomeFooter } from "@/components/home/home-footer";
import { FaqAccordion } from "@/components/faq/faq-accordion";
import { FAQ_GROUPS } from "@/components/faq/faq-content";
import { ContactChannels } from "@/components/support/contact-channels";
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
              <ContactChannels className="items-center" />
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
