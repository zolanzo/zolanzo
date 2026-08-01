import * as LucideIcons from "lucide-react";
import * as BrandIcons from "@/components/ui/brand-icons";

/**
 * Standard ZOLANZO Icon Sizing & Style Guidelines:
 * - Small: 16px
 * - Default: 20px
 * - Navigation: 24px
 * - Large Cards: 32px
 * - Feature Icons: 40px
 * - Stroke Width: 2
 */
export const ICON_SIZES = {
  small: 16,
  default: 20,
  navigation: 24,
  largeCards: 32,
  feature: 40,
} as const;

export const ICON_STROKE_WIDTH = 2 as const;

export type IconSizeToken = keyof typeof ICON_SIZES | number;

// Re-export Lucide and Brand icon components
export * from "lucide-react";
export * from "@/components/ui/brand-icons";

export { LucideIcons, BrandIcons };
