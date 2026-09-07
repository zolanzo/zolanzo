import { buildPageMetadata } from "@/components/seo/build-metadata";
import { MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";
import { ContactChannels } from "@/components/support/contact-channels";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/components/legal/terms-sections";

export const metadata = buildPageMetadata({
  title: "Terms & Conditions",
  description: "Terms & Conditions for using the ZOLANZO workforce marketplace.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <MarketingPage title="Terms & Conditions" intro={TERMS_INTRO}>
      {TERMS_SECTIONS.map((section) => (
        <MarketingSection key={section.title} title={section.title}>
          {section.paragraphs.map((paragraph, index) => (
            <p key={`${section.title}-${index}`}>{paragraph}</p>
          ))}
        </MarketingSection>
      ))}
      <ContactChannels />
    </MarketingPage>
  );
}
