// Official Coca-Cola logo — rendered from the red-fill SVG wordmark in
// public/brand/coca-cola-logo.svg. Purely presentational; callers control
// size via className (width-based; height auto-scales to preserve aspect ratio).

export interface LogoProps {
  /** 'white' inverts the red SVG to pure white (for use on red backgrounds).
   *  'red' renders the SVG as-is. Default: 'white'. */
  variant?: 'white' | 'red';
  /** Additional Tailwind / CSS classes merged onto the <img>. */
  className?: string;
}

const FILTER_WHITE =
  'brightness(0) invert(1) drop-shadow(0 2px 12px rgba(0,0,0,0.45)) drop-shadow(0 1px 4px rgba(0,0,0,0.3))';

export function Logo({ variant = 'white', className = '' }: LogoProps) {
  const classes = ['select-none', 'pointer-events-none', 'h-auto', className]
    .filter(Boolean)
    .join(' ');

  return (
    <img
      src="/brand/coca-cola-logo.svg"
      alt="Coca-Cola"
      className={classes}
      style={variant === 'white' ? { filter: FILTER_WHITE } : undefined}
      draggable={false}
    />
  );
}
