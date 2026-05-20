type LogoProps = {
  size?: number;
  className?: string;
};

// Circular brand badge — placeholder rendition of the resort's sun/waves logo.
export function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 50% 30%, #2cc0c0 0%, #15999b 45%, #1c3a5e 100%)",
      }}
      aria-label="Binukbok View Point Resort logo"
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="23" cy="9" r="3" fill="#ffe08a" />
        <path
          d="M3 21c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"
          stroke="#eafcff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M3 25c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"
          stroke="#bff0f3"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M14 17l4-8 1.5 7"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
