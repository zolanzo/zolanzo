import Image from "next/image";
import { cn } from "@/utils";

type ThemeLogoProps = {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function ThemeLogo({
  width = 155,
  height = 40,
  className,
  priority = false,
}: ThemeLogoProps) {
  const imageClassName = cn("w-auto object-contain", className);

  return (
    <span className="relative inline-flex items-center">
      <Image
        src="/brand/light-theme-logo.webp"
        alt="ZOLANZO Logo"
        width={width}
        height={height}
        className={cn(imageClassName, "block dark:hidden")}
        priority={priority}
      />
      <Image
        src="/brand/dark-theme-logo.webp"
        alt="ZOLANZO Logo"
        width={width}
        height={height}
        className={cn(imageClassName, "hidden dark:block")}
        priority={priority}
      />
    </span>
  );
}
