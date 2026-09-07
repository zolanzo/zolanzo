import Link from "next/link";
import { Navbar } from "@/components/navigation/navbar";
import { HomeFooter } from "@/components/home/home-footer";
import { ContactChannels } from "@/components/support/contact-channels";
import { buildPageMetadata } from "@/components/seo/build-metadata";

export const metadata = buildPageMetadata({
  title: "Contact",
  description: "Email or WhatsApp ZOLANZO.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-black tracking-tight">Contact</h1>
          <p className="text-sm text-muted-foreground">
            Email or WhatsApp us. Signed-in users can also open Help &amp; Support in the app.
          </p>
          <ContactChannels />
          <Link href="/faq" className="block text-sm font-semibold text-primary hover:underline">
            Visit FAQ
          </Link>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
