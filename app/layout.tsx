import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { buildPageMetadata } from "@/components/seo/build-metadata";
import { NONCE_HEADER } from "@/lib/security/headers";
import {
  THEME_BROWSER_COLOR_LIGHT,
  THEME_STORAGE_KEY,
} from "@/lib/theme/constants";
import { THEME_INIT_SCRIPT } from "@/lib/theme/init-script";
import { parseThemeMode } from "@/lib/theme/storage";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  ...buildPageMetadata(),
  applicationName: "ZOLANZO",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZOLANZO",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: THEME_BROWSER_COLOR_LIGHT,
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerNonce = (await headers()).get(NONCE_HEADER);
  const nonce = headerNonce ? headerNonce : undefined;
  const ssrPreference = parseThemeMode(
    (await cookies()).get(THEME_STORAGE_KEY)?.value,
  );

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppProviders ssrPreference={ssrPreference}>{children}</AppProviders>
      </body>
    </html>
  );
}
