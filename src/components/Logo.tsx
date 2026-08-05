import { cn } from '@/lib/utils';

/**
 * Wordmark only, matches the Smarty Wellness family header style.
 */
const Logo = ({
  compact = false,
  size = 'md',
  className,
}: {
  compact?: boolean;
  size?: 'md' | 'lg';
  className?: string;
}) => (
  <span
    className={cn(
      'font-extrabold uppercase leading-none tracking-tight',
      size === 'lg' ? 'text-lg' : compact ? 'text-base' : 'text-lg',
      className
    )}
  >
    <span className="text-primary">SMARTY</span>
    <span className="text-accent">LOGBOOK</span>
  </span>
);

export default Logo;
