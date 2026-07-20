import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-12 px-6 text-center dark:border-zinc-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
