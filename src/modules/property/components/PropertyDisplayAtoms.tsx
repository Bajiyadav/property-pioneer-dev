export function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function RoomCard({ title, desc, image }: { title: string; desc: string; image: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-secondary/30">
      <img src={image} alt={title} className="h-44 w-full object-cover" />
      <div className="p-4">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export function ReviewCard({ author, role, text }: { author: string; role: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-secondary/30 p-4">
      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
        ★★★★★ <span className="text-muted-foreground font-normal ml-1">5.0</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground italic leading-relaxed">"{text}"</p>
      <div className="mt-3 border-t border-border/30 pt-2">
        <p className="text-xs font-bold text-foreground">{author}</p>
        <p className="text-[10px] text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}
