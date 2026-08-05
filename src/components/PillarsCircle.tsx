import { Brain } from 'lucide-react';

type Item = { e: string; t: string; s?: string; tint?: string };

/**
 * Responsive circular flow used everywhere: items arranged around a dashed
 * ring with clockwise arrows and a labelled centre chip.
 */
const PillarsCircle = ({
  items,
  centerIcon: CenterIcon = Brain,
  centerLabel = 'A logbook with a brain',
  size = 'md',
}: {
  items: Item[];
  centerIcon?: React.ElementType;
  centerLabel?: string;
  size?: 'sm' | 'md';
}) => {
  const n = items.length;
  const R = 36;
  const tints = ['bg-mod-health/30', 'bg-mod-fitness/30', 'bg-mod-finance/30', 'bg-mod-personal/30'];
  const sm = size === 'sm';

  const wrap = sm ? 'max-w-[250px] lg:max-w-[330px]' : 'max-w-[280px] lg:max-w-[480px]';
  const centre = sm
    ? 'h-[84px] w-[84px] lg:h-[110px] lg:w-[110px]'
    : 'h-[104px] w-[104px] lg:h-[150px] lg:w-[150px]';
  const centreText = sm ? 'text-[10px] lg:text-[12px]' : 'text-[11px] lg:text-[14px]';
  const nodeWidth = sm ? 'w-[84px] lg:w-[104px]' : 'w-[92px] lg:w-[124px]';
  const bubble = sm ? 'h-9 w-9 lg:h-12 lg:w-12 text-sm lg:text-xl' : 'h-10 w-10 lg:h-14 lg:w-14 text-base lg:text-2xl';
  const nodeText = sm ? 'text-[11px] lg:text-[13px]' : 'text-[11.5px] lg:text-[14px]';

  return (
    <div className={`relative mx-auto aspect-square w-full ${wrap}`}>
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
      <div
        className={`absolute left-1/2 top-1/2 flex ${centre} -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full bg-gradient-primary px-2 text-center shadow-glow`}
      >
        <CenterIcon className={`${sm ? 'h-3.5 w-3.5 lg:h-5 lg:w-5' : 'h-4 w-4 lg:h-6 lg:w-6'} text-primary-foreground`} />
        <p className={`${centreText} font-bold leading-tight text-primary-foreground`}>{centerLabel}</p>
      </div>

      {/* nodes */}
      {items.map((item, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + R * Math.cos(a);
        const top = 50 + R * Math.sin(a);
        return (
          <div
            key={item.t}
            className={`absolute flex ${nodeWidth} -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1`}
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span
              className={`flex ${bubble} items-center justify-center rounded-full ring-4 ring-background ${item.tint ?? tints[i % tints.length]}`}
            >
              {item.e}
            </span>
            <p className={`text-center ${nodeText} font-bold leading-tight text-foreground`}>
              {item.t}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default PillarsCircle;
