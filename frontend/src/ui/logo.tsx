// Chokepoint mark: supply lines converge through a single gate (the diamond) and fan back out.
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  const ys = [12, 22, 32, 42, 52];
  return (
    <svg className={`logo-mark ${className}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        {ys.map((y, i) => (
          <path key={y} strokeWidth={i === 2 ? 3.2 : 2.4} opacity={i === 2 ? 1 : 0.8}
            d={y === 32 ? "M4 32 H60" : `M4 ${y} C 19 ${y}, 23 32, 32 32 C 41 32, 45 ${y}, 60 ${y}`} />
        ))}
      </g>
      <rect x="27" y="27" width="10" height="10" transform="rotate(45 32 32)" fill="var(--band)" stroke="currentColor" strokeWidth="2.8" />
    </svg>
  );
}
