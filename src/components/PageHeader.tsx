import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
}

export const PageHeader = memo(function PageHeader({ title, subtitle, badge, icon, actions, backButton }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3.5">
        {backButton}
        {icon && (
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/5">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-header-title">{title}</h1>
            {badge && (
              <Badge variant="secondary" className="text-[10px] font-extrabold rounded-full px-2.5 uppercase tracking-wider">
                {badge}
              </Badge>
            )}
          </div>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5 font-medium">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
});
