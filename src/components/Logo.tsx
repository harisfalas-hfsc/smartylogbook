import { cn } from '@/lib/utils';

const Logo = ({ compact = false, className }: { compact?: boolean; className?: string }) => (
  <div className={cn('flex items-center gap-2.5', className)}>
    <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15.5" />
        <path d="M6.5 18.5H19V21H6.5A2.5 2.5 0 0 1 4 18.5v-13" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    </div>
    <div className="leading-none">
      <p className="text-[15px] font-extrabold tracking-tight text-foreground">
        Smarty <span className="gradient-text">Logbook</span>
      </p>
      {!compact && <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Smarty Wellness</p>}
    </div>
  </div>
);

export default Logo;
