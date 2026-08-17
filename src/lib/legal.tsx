import { ReactNode } from 'react';

export const LegalPage = ({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-10">
    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
    <h1 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
      {title}
    </h1>
    {subtitle && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
    <p className="mt-3 text-xs text-muted-foreground">
      Last updated: {new Date().getFullYear()}
    </p>
    <div className="mt-6 space-y-2.5">{children}</div>
  </div>
);

export const LegalSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="smarty-card p-5">
    <h2 className="text-sm font-bold text-foreground">{title}</h2>
    <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:space-y-1.5">
      {children}
    </div>
  </section>
);
