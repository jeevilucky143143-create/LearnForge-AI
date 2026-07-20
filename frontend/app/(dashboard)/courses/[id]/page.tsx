"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../../utils/api";
import {
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  CheckCircle2,
  Play,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface LessonRecord {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
}

interface ChapterRecord {
  id: string;
  title: string;
  order_index: number;
  lessons: LessonRecord[];
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time_minutes: number;
  learning_objectives: string;
  progress_percentage: number;
  resume_lesson_id: string | null;
  chapters: ChapterRecord[];
}

export default function CourseOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const courseId = resolvedParams.id;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchCourseDetail() {
      try {
        const res = await api.get(`/courses/${courseId}`);
        setCourse(res.data);
        // Expand all chapters by default
        const expansions: Record<string, boolean> = {};
        res.data.chapters.forEach((ch: ChapterRecord) => {
          expansions[ch.id] = true;
        });
        setExpandedChapters(expansions);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load course details.");
      } finally {
        setLoading(false);
      }
    }
    fetchCourseDetail();
  }, [courseId]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-xl text-center py-12">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400 mb-4">
          {error || "Course not found"}
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Courses
        </Link>
      </div>
    );
  }

  // Count total lessons
  const totalLessons = course.chapters.reduce((acc, chap) => acc + chap.lessons.length, 0);

  return (
    <div className="space-y-8">
      {/* Back breadcrumb */}
      <div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Courses
        </Link>
      </div>

      {/* Hero Header */}
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2 space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 capitalize dark:bg-indigo-950/40 dark:text-indigo-400">
            {course.difficulty}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {course.title}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {course.description}
          </p>

          {/* Objectives */}
          {course.learning_objectives && (
            <div className="pt-4">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                What you will learn
              </h3>
              <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                {course.learning_objectives}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar stats panel */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-6 dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Estimated Time</span>
              <span className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
                <Clock className="h-4 w-4" /> {course.estimated_time_minutes} minutes
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Chapters</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {course.chapters.length} chapters
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Lessons</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {totalLessons} topics
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2 border-t border-zinc-100 pt-6 dark:border-zinc-900">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-500 dark:text-zinc-400">Course Progress</span>
              <span className="text-indigo-600 dark:text-indigo-400">
                {course.progress_percentage}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
                style={{ width: `${course.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Resume CTA */}
          {course.resume_lesson_id ? (
            <Link
              href={`/courses/${course.id}/lessons/${course.resume_lesson_id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Play className="h-4 w-4 fill-white" />
              {course.progress_percentage > 0 ? "Continue Learning" : "Start Course"}
            </Link>
          ) : null}

          {/* Practice Quizzes CTA */}
          <Link
            href={`/courses/${course.id}/quizzes`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200/80 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 active:scale-95 transition-all mt-3"
          >
            Practice Assessments & Quizzes
          </Link>
        </div>
      </div>

      {/* Chapters & Lessons Accordion list */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Course Structure
        </h2>

        <div className="space-y-3">
          {course.chapters.map((chapter) => {
            const isExpanded = !!expandedChapters[chapter.id];
            
            // Calculate chapter lessons completed
            const completedInChapter = chapter.lessons.filter(l => l.completed).length;
            const totalInChapter = chapter.lessons.length;
            const isChapterCompleted = completedInChapter === totalInChapter && totalInChapter > 0;

            return (
              <div
                key={chapter.id}
                className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden dark:border-zinc-800/80 dark:bg-zinc-950"
              >
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-400 tracking-wider">
                      CH {chapter.order_index}
                    </span>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                      {chapter.title}
                    </h3>
                    {isChapterCompleted && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Done
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span>
                      {completedInChapter}/{totalInChapter} completed
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* Lessons list */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 bg-zinc-50/30 divide-y divide-zinc-100 px-6 dark:border-zinc-900 dark:bg-zinc-950/50 dark:divide-zinc-900">
                    {chapter.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/courses/${course.id}/lessons/${lesson.id}`}
                        className="flex items-center justify-between py-3.5 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <div className="flex items-center gap-3">
                          {lesson.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-zinc-300 dark:border-zinc-800 shrink-0" />
                          )}
                          <span className="text-sm font-medium">
                            {lesson.title}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
