import { PageHeader, securityPoints } from '@/lib/marketing';

const SecurityPage = () => (
  <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-10">
    <PageHeader eyebrow="Security" title="Private by architecture." subtitle="Your life story deserves more than a checkbox." />
    <div className="grid gap-2.5 sm:grid-cols-3">
      {securityPoints.map((s) => (
        <div key={s.t} className="smarty-card p-5">
          <s.icon className="h-5 w-5 text-primary" />
          <p className="mt-2.5 text-sm font-bold text-foreground">{s.t}</p>
          <p className="mt-1 text-xs text-muted-foreground">{s.s}</p>
        </div>
      ))}
    </div>
  </div>
);

export default SecurityPage;
