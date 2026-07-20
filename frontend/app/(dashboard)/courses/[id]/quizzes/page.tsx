"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../../../utils/api";
import {
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Calendar,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Play
} from "lucide-react";

interface LessonOut {
  id: string;
  title: string;
}

interface ChapterOut {
  id: string;
  title: string;
  order_index: number;
  lessons: LessonOut[];
}

interface CourseDetail {
  id: string;
  title: string;
  chapters: ChapterOut[];
}

interface AttemptRecord {
  id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

export default function QuizSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const courseId = resolvedParams.id;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz config state
  const [scope, setScope] = useState<"course" | "chapter" | "lesson">("course");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState<number>(5);

  useEffect(() => {
    async function loadQuizScreenData() {
      try {
        const [courseRes, attemptsRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/quizzes/courses/${courseId}`)
        ]);
        setCourse(courseRes.data);
        setAttempts(attemptsRes.data || []);
        
        // Default scopes if chapters/lessons exist
        if (courseRes.data.chapters.length > 0) {
          setSelectedChapterId(courseRes.data.chapters[0].id);
          if (courseRes.data.chapters[0].lessons.length > 0) {
            setSelectedLessonId(courseRes.data.chapters[0].lessons[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load quiz selection screen data:", err);
        setError("Failed to load quiz syllabus options.");
      } finally {
        setLoading(false);
      }
    }
    loadQuizScreenData();
  }, [courseId]);

  // Adjust lesson selection when chapter selection changes
  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chId = e.target.value;
    setSelectedChapterId(chId);
    if (course) {
      const ch = course.chapters.find(c => c.id === chId);
      if (ch && ch.lessons.length > 0) {
        setSelectedLessonId(ch.lessons[0].id);
      } else {
        setSelectedLessonId("");
      }
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    setError(null);
    setGenerating(true);

    try {
      const res = await api.post("/quizzes/generate", {
        course_id: courseId,
        chapter_id: scope === "chapter" ? selectedChapterId : null,
        lesson_id: scope === "lesson" ? selectedLessonId : null,
        num_questions: numQuestions
      });

      const quizId = res.data.id;

      // Start quiz attempt immediately
      const attemptRes = await api.post(`/quizzes/${quizId}/attempts`);
      const attemptId = attemptRes.data.attempt_id;

      // Navigate to the player screen
      router.push(`/courses/${courseId}/quizzes/player?quiz_id=${quizId}&attempt_id=${attemptId}`);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "AI failed to generate a quiz from this text. Please try again.");
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-xl text-center py-12">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 mb-4">
          Course not found
        </div>
        <Link href="/courses" className="text-sm font-semibold text-indigo-600 hover:underline">
          <ArrowLeft className="h-4 w-4 inline mr-1" /> Back to My Courses
        </Link>
      </div>
    );
  }

  // Selected chapter lessons helper
  const activeChapterLessons = selectedChapterId
    ? course.chapters.find(c => c.id === selectedChapterId)?.lessons || []
    : [];

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div>
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {course.title}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
        {/* Generate Quiz Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-950">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-indigo-500" /> Generate AI Assessment
            </h2>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              Customize your assessment parameters and let the AI generate unique questions based on course syllabus.
            </p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="mt-6 space-y-5">
              {/* Quiz Scope */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Quiz Scope
                </label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {[
                    { id: "course", label: "Full Course" },
                    { id: "chapter", label: "Chapter Scope" },
                    { id: "lesson", label: "Single Topic" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setScope(opt.id as any)}
                      disabled={generating}
                      className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                        scope === opt.id
                          ? "border-indigo-600 bg-indigo-50/30 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400"
                          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scoped dropdowns */}
              {scope === "chapter" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider" htmlFor="chapter-select">
                    Select Chapter
                  </label>
                  <select
                    id="chapter-select"
                    value={selectedChapterId}
                    onChange={handleChapterChange}
                    disabled={generating}
                    className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 px-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-indigo-500 dark:focus:bg-zinc-900"
                  >
                    {course.chapters.map(ch => (
                      <option key={ch.id} value={ch.id}>
                        CH {ch.order_index}: {ch.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scope === "lesson" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider" htmlFor="chapter-select-lesson">
                      Select Chapter
                    </label>
                    <select
                      id="chapter-select-lesson"
                      value={selectedChapterId}
                      onChange={handleChapterChange}
                      disabled={generating}
                      className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 px-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      {course.chapters.map(ch => (
                        <option key={ch.id} value={ch.id}>
                          CH {ch.order_index}: {ch.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider" htmlFor="lesson-select">
                      Select Topic
                    </label>
                    <select
                      id="lesson-select"
                      value={selectedLessonId}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      disabled={generating || activeChapterLessons.length === 0}
                      className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 px-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      {activeChapterLessons.map(les => (
                        <option key={les.id} value={les.id}>
                          {les.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Question count */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Number of Questions
                </label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {[5, 10, 20].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setNumQuestions(size)}
                      disabled={generating}
                      className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                        numQuestions === size
                          ? "border-indigo-600 bg-indigo-50/30 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400"
                          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {size} Questions
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30 disabled:opacity-50 min-w-[180px]"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white" /> Start AI Assessment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Quiz History panel */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-950 space-y-6">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
            Assessment History
          </h3>

          {attempts.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
              <p className="text-xs">No previous quiz attempts recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className="rounded-xl border border-zinc-100 p-3 space-y-3 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-zinc-950 dark:text-zinc-200 line-clamp-1">
                        {att.quiz_title}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(att.completed_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric"
                        })}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                      {att.score}/{att.total_questions}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-semibold border-t border-zinc-100/50 pt-2 dark:border-zinc-900/50">
                    <span className="text-zinc-400">
                      Score: {att.percentage}%
                    </span>
                    <Link
                      href={`/courses/${courseId}/quizzes/results?attempt_id=${att.id}`}
                      className="text-indigo-600 hover:underline dark:text-indigo-400 flex items-center gap-0.5"
                    >
                      Review Answers <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
