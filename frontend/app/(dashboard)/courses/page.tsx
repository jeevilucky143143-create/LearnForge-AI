"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../../utils/api";
import EmptyState from "../../../components/EmptyState";
import { BookOpen, Plus, Loader2, Clock, BookMarked } from "lucide-react";

interface CourseRecord {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time_minutes: number;
  total_chapters: number;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await api.get("/courses");
        setCourses(res.data || []);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load courses.");
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            My Courses
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Review and resume all your AI-generated courses
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Generate Course
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <EmptyState
          title="No Courses Found"
          description="You haven't converted any PDFs to interactive courses yet. Generate one now!"
          icon={BookOpen}
          action={
            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Upload PDF
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isCompleted = course.progress_percentage === 100;
            return (
              <div
                key={course.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition-all hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 capitalize dark:bg-indigo-950/40 dark:text-indigo-400">
                      {course.difficulty}
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Completed
                      </span>
                    )}
                  </div>
                  
                  <h3 className="mt-4 font-bold text-zinc-900 line-clamp-2 dark:text-zinc-50">
                    {course.title}
                  </h3>
                  
                  <p className="mt-2 text-xs text-zinc-500 line-clamp-2 dark:text-zinc-400">
                    {course.description}
                  </p>

                  <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {course.estimated_time_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <BookMarked className="h-3.5 w-3.5" />
                      {course.total_lessons} lessons
                    </span>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-zinc-400 dark:text-zinc-500">Progress</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{course.progress_percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
                        style={{ width: `${course.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                  <Link
                    href={`/courses/${course.id}`}
                    className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {course.progress_percentage > 0 ? "Resume Learning" : "Start Learning"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
