import { APP_CONFIG } from "@/config/app";
import { WhatsAppSupportLink } from "@/components/support/whatsapp-support-link";

type ContactChannelsProps = {
  className?: string;
};

/**
 * Single public contact pair: official email + WhatsApp.
 */
export function ContactChannels({ className = "" }: ContactChannelsProps) {
  return (
    <div className={`flex flex-col items-start gap-3 ${className}`.trim()}>
      <a
        href={`mailto:${APP_CONFIG.supportEmail}`}
        className="text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
      >
        {APP_CONFIG.supportEmail}
      </a>
      <WhatsAppSupportLink />
    </div>
  );
}
