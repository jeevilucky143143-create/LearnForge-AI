"use client";

import React, { useState, useEffect } from "react";
import api from "../../../utils/api";
import {
  Loader2,
  Calendar,
  BookOpen,
  Clock,
  Award,
  Flame,
  CheckCircle
} from "lucide-react";

interface ProgressPoint {
  date: string;
  lessons_completed: number;
  quizzes_completed: number;
}

interface AnalyticsData {
  lessons_completed: number;
  courses_completed: number;
  study_time_minutes: number;
  quiz_average: number;
  learning_streak: number;
  weekly_progress: ProgressPoint[];
  monthly_progress: ProgressPoint[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.get("/analytics");
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load learning analytics details.");
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
        {error || "Analytics not found"}
      </div>
    );
  }

  // Calculate max lessons completed in a single day to scale chart heights
  const maxLessons = Math.max(...data.weekly_progress.map(p => p.lessons_completed), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
          Learning Analytics
        </h1>
        <p className="text-sm text-zinc-400 mt-1 dark:text-zinc-500">
          Monitor your study streaks, quiz accuracy scores, and weekly module accomplishments.
        </p>
      </div>

      {/* Grid boxes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-950 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {data.lessons_completed}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Lessons Completed
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-950 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {data.courses_completed}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Courses Finished
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-950 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {data.study_time_minutes}m
            </span>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Study Duration
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-950 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {data.quiz_average}%
            </span>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Quiz Average
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-950 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
            <Flame className="h-6 w-6 fill-orange-500" />
          </div>
          <div>
            <span className="block text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {data.learning_streak} Days
            </span>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Current Streak
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Weekly Completed Lessons - CSS Bar Graph */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-950 space-y-6">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
              Weekly Progress
            </h3>
            <p className="text-xs text-zinc-400 mt-1 dark:text-zinc-500">
              Lessons completed over the last 7 days.
            </p>
          </div>

          <div className="flex items-end justify-between h-[200px] border-b border-zinc-150 pb-4 dark:border-zinc-900 pt-6">
            {data.weekly_progress.map((point) => {
              const heightPct = (point.lessons_completed / maxLessons) * 100;
              const dayLabel = new Date(point.date).toLocaleDateString(undefined, { weekday: "short" });
              return (
                <div key={point.date} className="flex flex-col items-center gap-2 group w-full">
                  <div className="relative flex flex-col justify-end w-6 sm:w-8 h-[140px] rounded-t-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div
                      className="w-full rounded-t-lg bg-indigo-600 dark:bg-indigo-500 transition-all duration-500 relative"
                      style={{ height: `${heightPct}%` }}
                    >
                      {/* Tooltip on hover */}
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded transition-all dark:bg-zinc-50 dark:text-zinc-900 shadow-xs shrink-0 whitespace-nowrap">
                        {point.lessons_completed} lessons
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Completion Timeline (Last 10 study days) */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-950 space-y-6">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
              Activity History
            </h3>
            <p className="text-xs text-zinc-400 mt-1 dark:text-zinc-500">
              Completions over the last two weeks.
            </p>
          </div>

          <div className="space-y-3.5 max-h-[200px] overflow-y-auto pr-1">
            {data.monthly_progress.slice(-14).reverse().map((point) => {
              if (point.lessons_completed === 0 && point.quizzes_completed === 0) return null;
              return (
                <div
                  key={point.date}
                  className="flex items-center justify-between border-b border-zinc-50 pb-2 last:border-0 last:pb-0 dark:border-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {new Date(point.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    {point.lessons_completed > 0 && (
                      <span className="text-indigo-600 dark:text-indigo-400">
                        +{point.lessons_completed} Lessons
                      </span>
                    )}
                    {point.quizzes_completed > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        +{point.quizzes_completed} Quiz
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
