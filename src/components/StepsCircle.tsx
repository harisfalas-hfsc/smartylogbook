import { steps } from '@/lib/marketing';

/**
 * Mobile-only circular flow: the six stages arranged as a loop,
 * connected by a dashed ring with arrowheads between each node.
 */
const StepsCircle = () => {
  const n = steps.length;
  const R = 38; // node orbit radius in % of the square container

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[330px]">
      {/* connecting ring */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          className="stroke-primary/30"
          strokeWidth="0.8"
          strokeDasharray="2 2.5"
        />
        {steps.map((_, i) => {
          const a = ((i + 0.5) / n) * Math.PI * 2;
          const x = 50 + R * Math.cos(a);
          const y = 50 + R * Math.sin(a);
          // clockwise tangent direction at this point
          const deg = (Math.atan2(Math.cos(a), Math.sin(a)) * 180) / Math.PI;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${-deg})`}>
              <path d="M-1.6,-2 L2.4,0 L-1.6,2 Z" className="fill-primary" />
            </g>
          );
        })}
      </svg>


      {/* centre label */}
      <div className="absolute left-1/2 top-1/2 w-24 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-primary">Always</p>
        <p className="text-[12.5px] font-bold leading-tight text-foreground">connected</p>
      </div>

      {/* nodes */}
      {steps.map((s, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + R * Math.cos(a);
        const top = 50 + R * Math.sin(a);
        return (
          <div
            key={s.title}
            className="absolute flex w-[74px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary shadow-glow ring-4 ring-background">
              <s.icon className="h-[18px] w-[18px] text-primary-foreground" />
            </span>
            <p className="text-center text-[11.5px] font-bold leading-tight text-foreground">
              <span className="text-primary">{i + 1}.</span> {s.title}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default StepsCircle;
