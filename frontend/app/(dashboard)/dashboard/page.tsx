"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";
import StatsCard from "../../../components/StatsCard";
import DashboardCard from "../../../components/DashboardCard";
import EmptyState from "../../../components/EmptyState";
import {
  BookOpen,
  UploadCloud,
  FileText,
  Clock,
  ArrowRight,
  Plus,
  Loader2,
  Calendar,
  AlertCircle,
  User,
  HelpCircle,
  Award,
} from "lucide-react";

interface PDFRecord {
  id: string;
  filename: string;
  file_size: number;
  status: string;
  created_at: string;
}

interface CourseRecord {
  id: string;
  title: string;
  difficulty: string;
  estimated_time_minutes: number;
  progress_percentage: number;
  created_at: string;
}

interface QuizAttemptRecord {
  id: string;
  quiz_title: string;
  score: number;
  percentage: number;
  completed_at: string;
}

interface DashboardStats {
  total_courses: number;
  total_pdfs: number;
  completed_courses: number;
  study_time_minutes: number;
  total_quizzes_taken: number;
  average_quiz_score: number;
  recent_pdfs: PDFRecord[];
  recent_courses: CourseRecord[];
  recent_quiz_attempts: QuizAttemptRecord[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [personalData, setPersonalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsRes, personalRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/personalization/dashboard")
        ]);
        setStats(statsRes.data);
        setPersonalData(personalRes.data);
      } catch (err: any) {
        setError("Failed to load dashboard statistics.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const base = "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium";
    switch (status) {
      case "completed":
        return `${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400`;
      case "processing":
        return `${base} bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 animate-pulse`;
      case "failed":
        return `${base} bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400`;
      default:
        return `${base} bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400`;
    }
  };

  // Safe destructuring with fallback values
  const totalCourses = stats?.total_courses ?? 0;
  const totalPDFs = stats?.total_pdfs ?? 0;
  const completedCourses = stats?.completed_courses ?? 0;
  const studyTime = stats?.study_time_minutes ?? 0;
  const totalQuizzes = stats?.total_quizzes_taken ?? 0;
  const avgQuizScore = stats?.average_quiz_score ?? 0;
  const recentPDFs = stats?.recent_pdfs ?? [];
  const recentCourses = stats?.recent_courses ?? [];
  const recentQuizAttempts = stats?.recent_quiz_attempts ?? [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-600/10 md:p-8 dark:from-indigo-950/60 dark:to-violet-950/40 dark:border dark:border-indigo-900/30">
        <h1 className="text-2xl font-bold md:text-3xl">
          Welcome back, {user?.full_name || "learner"}!
        </h1>
        <p className="mt-2 max-w-xl text-sm text-indigo-100/90 md:text-base">
          Convert static documents into structured learning modules. Check your progress, quiz yourself, and learn at your own pace.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Courses Generated"
          value={totalCourses}
          icon={BookOpen}
          description="In total generated"
        />
        <StatsCard
          title="PDFs Uploaded"
          value={totalPDFs}
          icon={FileText}
          description="Source files uploaded"
        />
        <StatsCard
          title="Courses Completed"
          value={completedCourses}
          icon={BookOpen}
          description="100% progress achieved"
        />
        <StatsCard
          title="Study Duration"
          value={`${studyTime}m`}
          icon={Clock}
          description="Total active learning time"
        />
        <StatsCard
          title="Quizzes Taken"
          value={totalQuizzes}
          icon={HelpCircle}
          description="Assessments completed"
        />
        <StatsCard
          title="Avg Quiz Score"
          value={`${avgQuizScore}%`}
          icon={Award}
          description="Average test score"
        />
      </div>

      {/* Main Grid Section */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Columns: Recent Courses & PDFs */}
        <div className="space-y-8 lg:col-span-2">
          {/* Recent Courses Card */}
          <DashboardCard
            title="My Recent Courses"
            subtitle="Pick up where you left off"
            action={
              totalCourses > 0 ? (
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null
            }
          >
            {recentCourses.length === 0 ? (
              <EmptyState
                title="No Courses Yet"
                description="Upload an educational PDF to convert it into a structured course."
                icon={BookOpen}
                action={
                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" /> Generate Course
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {recentCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col justify-between py-4 sm:flex-row sm:items-center first:pt-0 last:pb-0"
                  >
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {course.title}
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                        <span className="capitalize">{course.difficulty}</span>
                        <span>•</span>
                        <span>{course.estimated_time_minutes} min duration</span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {course.progress_percentage}% completed
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/courses/${course.id}`}
                      className="mt-2 inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 sm:mt-0 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      Resume Course
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Recent PDFs Card */}
          <DashboardCard
            title="Recent PDF Uploads"
            subtitle="Track processing of uploaded documents"
            action={
              totalPDFs > 0 ? (
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Upload New <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null
            }
          >
            {recentPDFs.length === 0 ? (
              <EmptyState
                title="No PDFs Uploaded"
                description="Upload textbook PDF, lecture slides, or references to start generating courses."
                icon={FileText}
                action={
                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" /> Upload Document
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
                  <thead className="bg-zinc-50 text-xs font-semibold text-zinc-700 uppercase dark:bg-zinc-900/50 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Filename</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-r-lg">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {recentPDFs.map((pdf) => (
                      <tr key={pdf.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <td className="px-4 py-3 font-medium text-zinc-900 max-w-[200px] truncate dark:text-zinc-200">
                          {pdf.filename}
                        </td>
                        <td className="px-4 py-3">{formatFileSize(pdf.file_size)}</td>
                        <td className="px-4 py-3">{getStatusBadge(pdf.status)}</td>
                        <td className="px-4 py-3">
                          {new Date(pdf.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Right 1 Column: Quick Actions & Personalization */}
        <div className="space-y-8">
          {/* Continue Learning */}
          {personalData?.continue_learning && (
            <DashboardCard title="Continue Learning">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1">
                    {personalData.continue_learning.title}
                  </h4>
                  <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
                    <span>Course Progress</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {personalData.continue_learning.progress_percentage}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
                    <div
                      className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
                      style={{ width: `${personalData.continue_learning.progress_percentage}%` }}
                    />
                  </div>
                </div>
                <Link
                  href={
                    personalData.continue_learning.resume_lesson_id
                      ? `/courses/${personalData.continue_learning.id}/lessons/${personalData.continue_learning.resume_lesson_id}`
                      : `/courses/${personalData.continue_learning.id}`
                  }
                  className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-95 transition-all"
                >
                  Resume Lesson
                </Link>
              </div>
            </DashboardCard>
          )}

          {/* Recommended Next Lesson */}
          {personalData?.recommended_lesson && (
            <DashboardCard title="Recommended Next Lesson">
              <div className="space-y-3">
                <div className="rounded-xl border border-zinc-100/80 bg-zinc-50/20 p-3.5 space-y-1.5 dark:border-zinc-900">
                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    {personalData.recommended_lesson.course_title}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed line-clamp-1">
                    {personalData.recommended_lesson.title}
                  </h4>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block truncate">
                    {personalData.recommended_lesson.chapter_title}
                  </span>
                </div>
                <Link
                  href={`/courses/${personalData.recommended_lesson.course_id}/lessons/${personalData.recommended_lesson.id}`}
                  className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/10"
                >
                  Start Reading
                </Link>
              </div>
            </DashboardCard>
          )}

          {/* Bookmarked Lessons Card */}
          {personalData?.bookmarked_lessons?.length > 0 && (
            <DashboardCard title="Pinned Lessons">
              <div className="space-y-3">
                {personalData.bookmarked_lessons.slice(0, 3).map((bm: any) => (
                  <Link
                    key={bm.id}
                    href={`/courses/${bm.course_id}/lessons/${bm.lesson_id}`}
                    className="block text-xs hover:bg-zinc-50 p-2 rounded-lg border border-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/40"
                  >
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block truncate">
                      {bm.course_title}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1 mt-0.5">
                      {bm.lesson_title}
                    </span>
                  </Link>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* Recent Notes Card */}
          {personalData?.recent_notes?.length > 0 && (
            <DashboardCard title="Recent Study Notes">
              <div className="space-y-3">
                {personalData.recent_notes.slice(0, 3).map((n: any) => (
                  <Link
                    key={n.id}
                    href={`/courses/${n.course_id}/lessons/${n.lesson_id}`}
                    className="block text-xs hover:bg-zinc-50 p-2.5 rounded-lg border border-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/40 space-y-1"
                  >
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-50 truncate">
                      {n.lesson_title}
                    </h4>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 line-clamp-1 leading-relaxed">
                      {n.markdown}
                    </p>
                  </Link>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* Quick Actions Card */}
          <DashboardCard title="Quick Actions">
            <div className="space-y-3">
              <Link
                href="/upload"
                className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Upload New PDF
                  </h4>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Generate courses with AI tutor
                  </p>
                </div>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Edit Profile
                  </h4>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Update your display details
                  </p>
                </div>
              </Link>
            </div>
          </DashboardCard>

          {/* Recent Quiz Attempts Card */}
          {recentQuizAttempts.length > 0 && (
            <DashboardCard title="Recent Quiz Attempts">
              <div className="space-y-4">
                {recentQuizAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0 last:pb-0 dark:border-zinc-900"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate pr-2">
                        {attempt.quiz_title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {new Date(attempt.completed_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 block">
                        {attempt.score} pts
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {attempt.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* Recent Activity Card */}
          <DashboardCard title="Recent Activity">
            <div className="flow-root">
              {totalCourses === 0 && totalPDFs === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6 dark:text-zinc-500">
                  No activity recorded yet.
                </p>
              ) : (
                <ul className="-mb-8">
                  {recentCourses.slice(0, 3).map((course, idx) => (
                    <li key={course.id}>
                      <div className="relative pb-8">
                        {idx !== recentCourses.slice(0, 3).length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-100 dark:bg-zinc-900"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                              <BookOpen className="h-4 w-4" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Generated course{" "}
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {course.title}
                                </span>
                              </p>
                            </div>
                            <div className="whitespace-nowrap text-right text-xs text-zinc-400 dark:text-zinc-500">
                              <Calendar className="inline-block h-3.5 w-3.5 mr-1" />
                              {new Date(course.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
