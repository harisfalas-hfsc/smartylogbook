import { Brain, Plus } from 'lucide-react';
import { MODULES } from '@/lib/constants';

const orbitItems = [
  ...MODULES,
  {
    id: 'custom',
    label: 'Your own',
    icon: Plus,
    color: 'text-primary',
    tint: 'bg-primary/10',
  },
];

const LifeModulesOrbit = () => {
  const radius = 38;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[330px]" aria-label="Life categories">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className="stroke-primary/20"
          strokeWidth="0.7"
          strokeDasharray="1.5 2.2"
        />
        {orbitItems.map((_, index) => {
          const angle = ((index + 0.5) / orbitItems.length) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          const rotation = (Math.atan2(Math.cos(angle), -Math.sin(angle)) * 180) / Math.PI;

          return (
            <g key={index} transform={`translate(${x} ${y}) rotate(${rotation})`}>
              <path d="M-1.5,-1.8 L2.1,0 L-1.5,1.8 Z" className="fill-primary" />
            </g>
          );
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 flex h-[98px] w-[98px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-gradient-primary px-3 text-center shadow-glow">
        <Brain className="h-5 w-5 text-primary-foreground" />
        <p className="mt-1 text-[11px] font-bold leading-tight text-primary-foreground">
          Filed for you
        </p>
      </div>

      {orbitItems.map((item, index) => {
        const angle = (index / orbitItems.length) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + radius * Math.cos(angle);
        const top = 50 + radius * Math.sin(angle);
        const Icon = item.icon;

        return (
          <div
            key={item.id}
            className="absolute flex w-[72px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-background ${item.tint}`}>
              <Icon className={`h-[18px] w-[18px] ${item.color}`} />
            </span>
            <span className="text-center text-[10px] font-bold leading-tight text-foreground">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default LifeModulesOrbit;