import { buildPageMetadata } from "@/components/seo/build-metadata";
import { LegalSupportPage } from "@/components/legal/legal-support-page";

export const metadata = buildPageMetadata({
  title: "Terms & Conditions",
  description: "Contact ZOLANZO Support for the current Terms & Conditions.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalSupportPage heading="Terms & Conditions" />
  );
}
