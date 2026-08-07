import Image, { type ImageProps } from "next/image";
import { cn } from "@/utils";

interface ThemedHeroImageProps extends Omit<ImageProps, "src" | "alt"> {
  alt?: string;
  lightSrc?: string;
  darkSrc?: string;
}

export function ThemedHeroImage({
  alt = "ZOLANZO Hero",
  lightSrc = "/brand/lady1.png",
  darkSrc = "/brand/lady2.png",
  className = "",
  width = 620,
  height = 620,
  priority = true,
  ...props
}: ThemedHeroImageProps) {
  const imageClassName = cn(
    "h-auto w-full select-none object-contain object-bottom transition-all duration-300 [mask-image:linear-gradient(to_bottom,black_76%,transparent_98%)]",
    className,
  );

  return (
    <div className="group relative flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 scale-90 rounded-full bg-primary/12 blur-3xl" />
      <Image
        src={lightSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn(imageClassName, "drop-shadow-2xl dark:hidden")}
        {...props}
      />
      <Image
        src={darkSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn(imageClassName, "hidden drop-shadow-2xl dark:block")}
        {...props}
      />
    </div>
  );
}
