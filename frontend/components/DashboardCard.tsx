import React from "react";

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function DashboardCard({
  title,
  subtitle,
  action,
  children,
}: DashboardCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 dark:border-zinc-900">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
