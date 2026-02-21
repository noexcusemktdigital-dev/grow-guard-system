interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
