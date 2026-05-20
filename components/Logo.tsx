import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
};

// Resort brand badge — the actual Binukbok View Point logo.
export function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <Image
      src="/images/binukbok-logo.png"
      alt="Binukbok View Point Resort logo"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
