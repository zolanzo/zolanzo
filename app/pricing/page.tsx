import { buildPageMetadata } from "@/components/seo/build-metadata";
import { MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";
import Link from "next/link";

export const metadata = buildPageMetadata({
  title: "Pricing",
  description: "How earning and hiring work on ZOLANZO. Create an account for free.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <MarketingPage
      title="Pricing"
      intro="It is free to create a ZOLANZO account. You pay for hired work; you earn when submitted work is approved."
    >
      <MarketingSection title="Earners">
        <p>
          There is no charge to browse and apply for available work. Earnings are the reward shown
          on each opportunity. After approval, funds are credited to your wallet. Withdrawals go to
          a supported local bank account when your available balance and verification checks are
          met.
        </p>
      </MarketingSection>
      <MarketingSection title="Hirers">
        <p>
          You fund a campaign before work goes live. That budget covers earner rewards. Any
          additional charges are shown before you confirm payment. Unused campaign funds follow the
          campaign and escrow rules in the product.
        </p>
      </MarketingSection>
      <MarketingSection title="Questions">
        <p>
          See{" "}
          <Link href="/faq" className="font-semibold text-primary hover:underline">
            FAQ
          </Link>{" "}
          for withdrawals and campaign setup, or{" "}
          <Link href="/contact" className="font-semibold text-primary hover:underline">
            contact us
          </Link>
          .
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
