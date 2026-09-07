import { Navbar } from "@/components/navigation/navbar";
import { HomeFooter } from "@/components/home/home-footer";
import { ContactChannels } from "@/components/support/contact-channels";
import { ContactForm } from "@/components/support/contact-form";
import { buildPageMetadata } from "@/components/seo/build-metadata";
import { createMathChallenge } from "@/lib/contact/math-challenge";
import { getContactPrefill } from "@/lib/contact/prefill";
import Link from "next/link";

export const metadata = buildPageMetadata({
  title: "Contact",
  description: "Email or WhatsApp ZOLANZO.",
  path: "/contact",
});

export default async function ContactPage() {
  const prefill = await getContactPrefill();
  const challenge = createMathChallenge();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">Contact</h1>
            <p className="text-sm text-muted-foreground">
              Send a message. Signed-in users can also open Help &amp; Support in the app.
            </p>
          </div>

          {challenge ? (
            <ContactForm
              initialChallenge={challenge}
              initialName={prefill.name}
              initialEmail={prefill.email}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              The form is temporarily unavailable. Use email or WhatsApp below.
            </p>
          )}

          <div className="space-y-3 border-t border-border pt-5">
            <ContactChannels />
            <Link href="/faq" className="block text-sm font-semibold text-primary hover:underline">
              Visit FAQ
            </Link>
          </div>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
