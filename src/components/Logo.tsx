import { cn } from '@/lib/utils';

const Logo = ({
  compact = false,
  size = 'md',
  className,
}: {
  compact?: boolean;
  size?: 'md' | 'lg';
  className?: string;
}) => {
  const lg = size === 'lg';
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-2xl bg-gradient-primary shadow-glow',
          lg ? 'h-10 w-10' : 'h-9 w-9'
        )}
      >
        <svg viewBox="0 0 24 24" className={cn('text-primary-foreground', lg ? 'h-6 w-6' : 'h-5 w-5')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15.5" />
          <path d="M6.5 18.5H19V21H6.5A2.5 2.5 0 0 1 4 18.5v-13" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      </div>
      <div className="leading-none">
        <p className={cn('font-extrabold tracking-tight text-foreground', lg ? 'text-[17px]' : 'text-[15px]')}>
          Smarty <span className="gradient-text">Logbook</span>
        </p>
        {!compact && <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Smarty Wellness</p>}
      </div>
    </div>
  );
};

export default Logo;
