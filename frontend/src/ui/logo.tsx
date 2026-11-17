// Chokepoint mark: a supply line interrupted by a gate, with a single point passing through.
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={`logo-mark ${className}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 32 H26 M38 32 H56" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <rect x="24" y="14" width="5" height="36" rx="1.5" fill="currentColor" />
      <rect x="35" y="14" width="5" height="36" rx="1.5" fill="currentColor" />
      <circle cx="32" cy="32" r="2.6" fill="currentColor" />
    </svg>
  );
}
