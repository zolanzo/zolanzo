import React from "react";

export type BrandType =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "twitter"
  | "whatsapp"
  | "telegram"
  | "linkedin"
  | "discord"
  | "google"
  | "microsoft"
  | "apple";

export type BrandVariant = "default" | "light" | "dark" | "monochrome" | "disabled";

export interface BrandSvgProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  variant?: BrandVariant;
}

/**
 * Official Brand Color Palette Map
 */
export const BRAND_COLORS: Record<BrandType, { primary: string; bg: string; text: string }> = {
  facebook: { primary: "#1877F2", bg: "#1877F2", text: "#FFFFFF" },
  instagram: { primary: "#E1306C", bg: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", text: "#FFFFFF" },
  tiktok: { primary: "#000000", bg: "#000000", text: "#FFFFFF" },
  youtube: { primary: "#FF0000", bg: "#FF0000", text: "#FFFFFF" },
  x: { primary: "#000000", bg: "#000000", text: "#FFFFFF" },
  twitter: { primary: "#1DA1F2", bg: "#1DA1F2", text: "#FFFFFF" },
  whatsapp: { primary: "#25D366", bg: "#25D366", text: "#FFFFFF" },
  telegram: { primary: "#229ED9", bg: "#229ED9", text: "#FFFFFF" },
  linkedin: { primary: "#0A66C2", bg: "#0A66C2", text: "#FFFFFF" },
  discord: { primary: "#5865F2", bg: "#5865F2", text: "#FFFFFF" },
  google: { primary: "#4285F4", bg: "#FFFFFF", text: "#4285F4" },
  microsoft: { primary: "#00A4EF", bg: "#F25022", text: "#FFFFFF" },
  apple: { primary: "#000000", bg: "#000000", text: "#FFFFFF" },
};

export function FacebookSvg({ size = 24, variant = "default", ...props }: BrandSvgProps) {
  const isMono = variant === "monochrome" || variant === "disabled";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 17.9895 4.38823 22.954 10.125 23.8542V15.4688H7.07812V12H10.125V9.35625C10.125 6.34875 11.9166 4.6875 14.6576 4.6875C15.9701 4.6875 17.3438 4.92188 17.3438 4.92188V7.875H15.8306C14.3399 7.875 13.875 8.80008 13.875 9.74977V12H17.2031L16.6711 15.4688H13.875V23.8542C19.6118 22.954 24 17.9895 24 12Z"
        fill={isMono ? "currentColor" : "#1877F2"}
      />
      <path
        d="M16.6711 15.4688L17.2031 12H13.875V9.74977C13.875 8.80008 14.3399 7.875 15.8306 7.875H17.3438V4.92188C17.3438 4.92188 15.9701 4.6875 14.6576 4.6875C11.9166 4.6875 10.125 6.34875 10.125 9.35625V12H7.07812V15.4688H10.125V23.8542C10.7441 23.9514 11.3719 24 12 24C12.6281 24 13.2559 23.9514 13.875 23.8542V15.4688H16.6711Z"
        fill={isMono ? "currentColor" : "#FFFFFF"}
      />
    </svg>
  );
}

export function InstagramSvg({ size = 24, variant = "default", ...props }: BrandSvgProps) {
  const isMono = variant === "monochrome" || variant === "disabled";
  const gradId = React.useId();

  if (isMono) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <radialGradient id={`${gradId}-ig-radial`} cx="30%" cy="107%" r="130%" fx="30%" fy="107%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill={`url(#${gradId}-ig-radial)`} />
      <path
        d="M12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7ZM12 15.2C10.2327 15.2 8.8 13.7673 8.8 12C8.8 10.2327 10.2327 8.8 12 8.8C13.7673 8.8 15.2 10.2327 15.2 12C15.2 13.7673 13.7673 15.2 12 15.2Z"
        fill="white"
      />
      <circle cx="16.5" cy="7.5" r="1.1" fill="white" />
      <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" stroke="white" strokeWidth="1.6" />
    </svg>
  );
}

export function TikTokSvg({ size = 24, variant = "default", ...props }: BrandSvgProps) {
  const isMono = variant === "monochrome" || variant === "disabled";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {!isMono && <rect width="24" height="24" rx="6" fill="#000000" />}
      <path
        d="M12.525 2.02C13.835 2 15.135 2.01 16.435 2C16.515 3.53 17.065 5.09 18.185 6.17C19.305 7.28 20.885 7.79 22.425 7.96V11.99C20.985 11.94 19.535 11.64 18.225 11.02C17.655 10.76 17.125 10.43 16.605 10.09C16.595 13.01 16.615 15.93 16.585 18.84C16.505 20.24 16.045 21.63 15.235 22.78C13.925 24.7 11.655 25.95 9.325 25.99C7.895 26.07 6.465 25.68 5.245 24.96C3.225 23.77 1.805 21.59 1.595 19.25C1.575 18.75 1.565 18.25 1.585 17.76C1.765 15.86 2.705 14.04 4.165 12.8C5.825 11.36 8.145 10.67 10.315 11.08V15.52C9.325 15.2 8.165 15.29 7.295 15.89C6.475 16.45 5.935 17.4 5.885 18.4C5.765 19.84 6.635 21.27 7.945 21.82C8.865 22.21 9.955 22.14 10.825 21.66C11.745 21.16 12.315 20.18 12.365 19.13C12.415 15.44 12.385 11.74 12.395 8.05V2.02H12.525Z"
        transform="scale(0.85) translate(1.5, 0.5)"
        fill={isMono ? "currentColor" : "#FFFFFF"}
      />
    </svg>
  );
}

export function YouTubeSvg({ size = 24, variant = "default", ...props }: BrandSvgProps) {
  const isMono = variant === "monochrome" || variant === "disabled";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M23.498 6.186C23.223 5.155 22.412 4.344 21.376 4.07C19.505 3.57 12 3.57 12 3.57C12 3.57 4.495 3.57 2.624 4.07C1.588 4.344 0.777 5.155 0.502 6.186C0 8.07 0 12 0 12C0 12 0 15.93 0.502 17.814C0.777 18.845 1.588 19.656 2.624 19.93C4.495 20.43 12 20.43 12 20.43C12 20.43 19.505 20.43 21.376 19.93C22.412 19.656 23.223 18.845 23.498 17.814C24 15.93 24 12 24 12C24 12 24 8.07 23.498 6.186Z"
        fill={isMono ? "currentColor" : "#FF0000"}
      />
      <path d="M9.545 15.568V8.432L15.818 12L9.545 15.568Z" fill="#FFFFFF" />
    </svg>
  );
}

export function XSvg({ size = 24, variant: _variant = "default", ...props }: BrandSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M18.244 2.25H21.552L14.325 10.51L22.827 21.75H16.17L10.956 14.933L4.99 21.75H1.68L9.41 12.915L1.254 2.25H8.08L12.793 8.481L18.244 2.25ZM17.083 19.77H18.916L7.084 4.126H5.117L17.083 19.77Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TwitterSvg(props: BrandSvgProps) {
  const isMono = props.variant === "monochrome" || props.variant === "disabled";
  if (isMono) return <XSvg {...props} />;
  return (
    <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z"
        fill="#1DA1F2"
      />
    </svg>
  );
}

export function WhatsAppSvg({ size = 24, variant = "default", ...props }: BrandSvgProps) {
  const isMono = variant === "monochrome" || variant === "disabled";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12.011 0C5.397 0 .025 5.371.023 11.987c0 2.112.55 4.173 1.597 5.987L0 24l6.19-1.624a11.94 11.94 0 005.817 1.503h.005c6.612 0 11.985-5.372 11.987-11.988C24 5.37 18.625 0 12.011 0z"
        fill={isMono ? "currentColor" : "#25D366"}
      />
      <path
        d="M18.78 15.424c-.298-.149-1.762-.87-2.035-.97-.272-.098-.471-.148-.67.15-.197.297-.767.97-.94 1.168-.173.198-.347.223-.645.074-.297-.149-1.257-.463-2.394-1.476-.884-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.521.15-.172.2-.296.3-.495.098-.198.05-.372-.026-.521-.074-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.571-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function TelegramSvg({ size = 24, variant = "default", ...props }: BrandSvgProps) {
  const isMono = variant === "monochrome" || variant === "disabled";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="12" fill={isMono ? "currentColor" : "#229ED9"} />
      <path
        d="M16.64 7.8C16.49 9.38 15.84 13.22 15.51 14.99C15.37 15.74 15.09 15.99 14.83 16.02C14.25 16.07 13.81 15.64 13.25 15.27C12.37 14.69 11.87 14.33 11.02 13.77C10.03 13.12 10.67 12.76 11.24 12.18C11.39 12.03 13.95 9.7 14 9.49C14.01 9.45 13.99 9.38 13.94 9.33C13.88 9.28 13.8 9.3 13.73 9.31C13.64 9.33 12.24 10.26 9.51 12.1C9.11 12.37 8.75 12.51 8.43 12.5C8.07 12.49 7.39 12.3 6.88 12.13C6.25 11.93 5.76 11.82 5.8 11.47C5.82 11.29 6.07 11.11 6.54 10.92C9.46 9.65 11.4 8.81 12.37 8.41C15.15 7.25 15.72 7.05 16.1 7.05C16.18 7.05 16.37 7.07 16.49 7.17C16.59 7.25 16.62 7.36 16.63 7.44C16.62 7.5 16.64 7.68 16.64 7.8Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function LinkedInSvg({ size = 24, variant = "default", ...props }: BrandSvgProps) {
  const isMono = variant === "monochrome" || variant === "disabled";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M19 0H5C2.239 0 0 2.239 0 5V19C0 21.761 2.239 24 5 24H19C21.761 24 24 21.761 24 19V5C24 2.239 21.761 0 19 0Z"
        fill={isMono ? "currentColor" : "#0A66C2"}
      />
      <path
        d="M5.5 8.5H8.27V19.5H5.5V8.5ZM6.88 4.5C5.99 4.5 5.27 5.22 5.27 6.11C5.27 7 5.99 7.72 6.88 7.72C7.77 7.72 8.49 7 8.49 6.11C8.49 5.22 7.77 4.5 6.88 4.5ZM18.5 19.5H15.75V14.5C15.75 13.12 15.72 11.35 13.83 11.35C11.91 11.35 11.62 12.85 11.62 14.4V19.5H8.87V8.5H11.51V9.99H11.55C11.92 9.29 12.82 8.35 14.52 8.35C17.7 8.35 18.5 10.45 18.5 13.17V19.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function DiscordSvg({ size = 24, variant = "default", ...props }: BrandSvgProps) {
  const isMono = variant === "monochrome" || variant === "disabled";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
        fill={isMono ? "currentColor" : "#5865F2"}
      />
    </svg>
  );
}

export function GoogleSvg({ size = 24, variant = "default", ...props }: BrandSvgProps) {
  const isMono = variant === "monochrome" || variant === "disabled";
  if (isMono) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="currentColor"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="currentColor"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          fill="currentColor"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function MicrosoftSvg({ size = 24, variant = "default", ...props }: BrandSvgProps) {
  const isMono = variant === "monochrome" || variant === "disabled";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="1" y="1" width="10" height="10" fill={isMono ? "currentColor" : "#F25022"} />
      <rect x="13" y="1" width="10" height="10" fill={isMono ? "currentColor" : "#7FBA00"} />
      <rect x="1" y="13" width="10" height="10" fill={isMono ? "currentColor" : "#00A4EF"} />
      <rect x="13" y="13" width="10" height="10" fill={isMono ? "currentColor" : "#FFB900"} />
    </svg>
  );
}

export function AppleSvg({ size = 24, variant: _variant = "default", ...props }: BrandSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.97.99-3.12-1 .04-2.18.67-2.88 1.49-.6.7-.1.3 1.97-.98 3.08 1.02.08 2.19-.59 2.87-1.45z"
        fill="currentColor"
      />
    </svg>
  );
}
