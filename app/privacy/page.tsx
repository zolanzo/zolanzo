import { buildPageMetadata } from "@/components/seo/build-metadata";
import { MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";
import { ContactChannels } from "@/components/support/contact-channels";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/components/legal/privacy-sections";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "How ZOLANZO collects and uses account, work, and support information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <MarketingPage title="Privacy Policy" intro={PRIVACY_INTRO}>
      {PRIVACY_SECTIONS.map((section) => (
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
