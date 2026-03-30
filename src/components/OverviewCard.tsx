interface OverviewCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}

const OverviewCard = ({ icon, label, value, sub }: OverviewCardProps) => (
  <div className="bg-card rounded-2xl p-4 shadow-card flex flex-col gap-2 animate-fade-in">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
);

export default OverviewCard;
