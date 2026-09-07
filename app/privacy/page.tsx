import { buildPageMetadata } from "@/components/seo/build-metadata";
import { LegalSupportPage } from "@/components/legal/legal-support-page";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "Contact ZOLANZO Support for the current Privacy Policy.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalSupportPage heading="Privacy Policy" />
  );
}
