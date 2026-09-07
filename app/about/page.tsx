import { buildPageMetadata } from "@/components/seo/build-metadata";
import { MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";
import Link from "next/link";

export const metadata = buildPageMetadata({
  title: "About",
  description: "ZOLANZO is a workforce marketplace for digital work across Africa.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <MarketingPage
      title="About ZOLANZO"
      intro="ZOLANZO is a workforce marketplace connecting people who complete digital work with businesses that need it done."
    >
      <MarketingSection title="What we do">
        <p>
          Earners browse available opportunities, complete online tasks, and get paid into a ZOLANZO
          wallet after work is approved. Hirers publish campaigns, fund work through escrow, and
          review submissions from one dashboard.
        </p>
        <p>
          The product is operated by ZOLANZO LTD, a Stankings company. Identity checks, SMS, email,
          and payments run through dedicated providers so ZOLANZO stays independently deployable.
        </p>
      </MarketingSection>
      <MarketingSection title="How to start">
        <p>
          Create a free account, choose Earn or Hire, and follow the onboarding steps. Read{" "}
          <Link href="/faq" className="font-semibold text-primary hover:underline">
            FAQ
          </Link>
          ,{" "}
          <Link href="/terms" className="font-semibold text-primary hover:underline">
            Terms &amp; Conditions
          </Link>
          , and{" "}
          <Link href="/privacy" className="font-semibold text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          before you rely on the platform for paid work.
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
