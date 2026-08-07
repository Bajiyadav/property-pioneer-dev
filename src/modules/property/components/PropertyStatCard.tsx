export function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}</div>
      <p className="mt-2 text-xs text-muted-foreground font-medium">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

export function ConnectivityItem({
  icon,
  title,
  dist,
}: {
  icon: React.ReactNode;
  title: string;
  dist: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-secondary/30 p-3.5">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-xs font-semibold text-foreground">{title}</span>
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">{dist}</span>
    </div>
  );
}
