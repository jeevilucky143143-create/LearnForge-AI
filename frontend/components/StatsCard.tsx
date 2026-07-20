import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition-all hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </span>
        {(trend || description) && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {trend && (
              <span
                className={`font-semibold ${
                  trend.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {trend.value}
              </span>
            )}
            {description && (
              <span className="text-zinc-400 dark:text-zinc-500">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
