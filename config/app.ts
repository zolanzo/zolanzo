/**
 * Application configuration (non-secret).
 */

export const APP_CONFIG = {
  name: "ZOLANZO",
  version: "0.1.0",
  supportEmail: "support@zolanzo.com",
  defaultLocale: "en",
  defaultTimezone: "UTC",
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  uploads: {
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/avif",
    ] as const,
    generateWebPOnUpload: true,
  },
  images: {
    defaultQuality: 82,
    blurPlaceholderSize: 16,
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
