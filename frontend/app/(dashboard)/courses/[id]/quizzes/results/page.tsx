"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../../../../../utils/api";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  BookOpen
} from "lucide-react";

interface QuestionReview {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
  selected_answer: string | null;
  is_correct: boolean;
  explanation: string;
  difficulty: string;
  lesson_title: string | null;
}

interface QuizResult {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  duration_seconds: number;
  completed_at: string;
  questions: QuestionReview[];
}

export default function QuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const courseId = resolvedParams.id;

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read query params safely on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setAttemptId(urlParams.get("attempt_id"));
    }
  }, []);

  useEffect(() => {
    if (!attemptId) return;

    async function loadAttemptDetails() {
      try {
        const res = await api.get(`/quizzes/attempts/${attemptId}`);
        setResult(res.data);
      } catch (err: any) {
        console.error("Failed to load attempt details:", err);
        setError("Failed to load attempt results details.");
      } finally {
        setLoading(false);
      }
    }
    loadAttemptDetails();
  }, [attemptId]);

  const formatDuration = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm text-zinc-400">Loading results...</span>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-xl text-center py-12 space-y-4">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error || "Results not found"}
        </div>
        <Link href={`/courses/${courseId}/quizzes`} className="text-indigo-600 hover:underline text-sm font-semibold">
          <ArrowLeft className="h-4 w-4 inline mr-1" /> Back to Quizzes
        </Link>
      </div>
    );
  }

  const passed = result.percentage >= 60.0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6 px-4">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href={`/courses/${courseId}/quizzes`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Link>
      </div>

      {/* Performance Summary Banner */}
      <div
        className={`rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${
          passed
            ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-950/40 dark:bg-emerald-950/20"
            : "border-amber-200 bg-amber-50/30 dark:border-amber-950/40 dark:bg-amber-950/10"
        }`}
      >
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
            {passed ? "Excellent Work!" : "Keep Practicing!"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
            {passed
              ? "You demonstrate a strong understanding of these syllabus concepts. Continue with the next chapter."
              : "Review the question explanations below and revisit the lessons to fill in gaps in your comprehension."}
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center">
            <span className="block text-2xl font-black text-zinc-950 dark:text-zinc-50">
              {result.percentage.toFixed(0)}%
            </span>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Accuracy
            </span>
          </div>

          <div className="text-center">
            <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {result.score}/{result.total_questions}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Score
            </span>
          </div>

          <div className="text-center">
            <span className="block text-2xl font-black text-zinc-950 dark:text-zinc-50 flex items-center gap-1 justify-center">
              <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
              {formatTime(result.duration_seconds)}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Duration
            </span>
          </div>
        </div>
      </div>

      {/* Questions list with review details */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Question Review
        </h2>

        <div className="space-y-4">
          {result.questions.map((q, idx) => {
            const isSelected = q.selected_answer !== null;
            return (
              <div
                key={q.id}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 space-y-4"
              >
                {/* Question Info Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 uppercase tracking-wider">
                      Question {idx + 1} • {q.question_type.replace("_", " ")}
                    </span>
                    {q.lesson_title && (
                      <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        Syllabus Reference: {q.lesson_title}
                      </span>
                    )}
                  </div>
                  
                  {q.is_correct ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CheckCircle className="h-3.5 w-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                      <XCircle className="h-3.5 w-3.5" /> Incorrect
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                  {q.question_text}
                </h3>

                {/* Options display for MCQ */}
                {q.question_type === "mcq" && q.options && (
                  <div className="grid gap-2">
                    {q.options.map((opt, oIdx) => {
                      const isCorrectOpt = opt === q.correct_answer;
                      const isSelectedOpt = opt === q.selected_answer;
                      
                      let optStyle = "border-zinc-100 bg-zinc-50/20 text-zinc-700 dark:border-zinc-900 dark:text-zinc-300";
                      if (isCorrectOpt) {
                        optStyle = "border-emerald-200 bg-emerald-50/10 text-emerald-700 dark:border-emerald-900/30 dark:text-emerald-400 font-semibold";
                      } else if (isSelectedOpt && !q.is_correct) {
                        optStyle = "border-red-200 bg-red-50/10 text-red-700 dark:border-red-900/30 dark:text-red-400 font-semibold";
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`flex items-center justify-between rounded-xl border p-3.5 text-xs ${optStyle}`}
                        >
                          <span>{opt}</span>
                          <span className="text-[10px] uppercase font-bold shrink-0">
                            {isCorrectOpt && "Correct Answer"}
                            {isSelectedOpt && !q.is_correct && "Your Selection"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* True/False or Fill-in Answer display */}
                {q.question_type !== "mcq" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/30 p-3 text-xs dark:border-zinc-900">
                      <span className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Your Answer
                      </span>
                      <span className={`block font-semibold mt-1 ${q.is_correct ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {q.selected_answer || "(unanswered)"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/10 p-3 text-xs dark:border-emerald-950/10">
                      <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">
                        Correct Answer
                      </span>
                      <span className="block font-semibold text-emerald-700 mt-1 dark:text-emerald-400">
                        {q.correct_answer}
                      </span>
                    </div>
                  </div>
                )}

                {/* AI Explanation block */}
                {q.explanation && (
                  <div className="rounded-xl bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                      Explanation:
                    </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-900">
        <Link
          href={`/courses/${courseId}`}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <BookOpen className="h-4 w-4" /> Return to Course
        </Link>
        <Link
          href={`/courses/${courseId}/quizzes`}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700"
        >
          <RotateCcw className="h-4 w-4" /> Practice Another Quiz
        </Link>
      </div>
    </div>
  );
}

function formatTime(totalSecs: number) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}
