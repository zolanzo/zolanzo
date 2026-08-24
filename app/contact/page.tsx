import Link from "next/link";
import { Navbar } from "@/components/navigation/navbar";
import { WhatsAppSupportLink } from "@/components/support/whatsapp-support-link";
import { APP_CONFIG } from "@/config/app";

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-border bg-card p-6 text-center shadow-soft sm:p-8">
          <h1 className="text-2xl font-black tracking-tight">Contact ZOLANZO</h1>
          <p className="text-sm text-muted-foreground">
            Message WhatsApp Support for help, disputes, and account questions.
          </p>
          <WhatsAppSupportLink className="w-full" />
          <Link href="/faq" className="block text-sm font-semibold text-primary hover:underline">
            Visit FAQ
          </Link>
          <p className="text-sm text-muted-foreground">
            {APP_CONFIG.supportWhatsApp.display}
          </p>
          <a
            href={`mailto:${APP_CONFIG.supportEmail}`}
            className="block text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            {APP_CONFIG.supportEmail}
          </a>
        </div>
      </main>
    </div>
  );
}
