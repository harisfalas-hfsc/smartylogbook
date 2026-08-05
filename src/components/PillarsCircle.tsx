import { Brain } from 'lucide-react';

type Item = { e: string; t: string; s: string; tint?: string };

/**
 * Mobile-only: the four "idea" pillars arranged around a circle
 * with clockwise arrows, same language as the other circles.
 */
const PillarsCircle = ({ items }: { items: Item[] }) => {
  const n = items.length;
  const R = 36;
  const tints = ['bg-mod-health/30', 'bg-mod-fitness/30', 'bg-mod-finance/30', 'bg-mod-personal/30'];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          className="stroke-primary/30"
          strokeWidth="0.8"
          strokeDasharray="2 2.5"
        />
        {items.map((_, i) => {
          const a = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + R * Math.cos(a);
          const y = 50 + R * Math.sin(a);
          const deg = (Math.atan2(Math.cos(a), -Math.sin(a)) * 180) / Math.PI;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${deg})`}>
              <path d="M-1.6,-2 L2.4,0 L-1.6,2 Z" className="fill-primary" />
            </g>
          );
        })}
      </svg>

      {/* centre */}
      <div className="absolute left-1/2 top-1/2 flex h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full bg-gradient-primary px-2 text-center shadow-glow">
        <Brain className="h-4 w-4 text-primary-foreground" />
        <p className="text-[11px] font-bold leading-tight text-primary-foreground">
          A logbook with a brain
        </p>
      </div>

      {/* nodes */}
      {items.map((item, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + R * Math.cos(a);
        const top = 50 + R * Math.sin(a);
        return (
          <div
            key={item.t}
            className="absolute flex w-[80px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-base ring-4 ring-background ${item.tint ?? tints[i % tints.length]}`}
            >
              {item.e}
            </span>
            <p className="text-center text-[11.5px] font-bold leading-tight text-foreground">
              {item.t}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default PillarsCircle;
