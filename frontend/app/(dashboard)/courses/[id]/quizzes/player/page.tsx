"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../../../../utils/api";
import {
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
  Clock
} from "lucide-react";

interface QuestionPlay {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
}

interface QuizPlay {
  id: string;
  title: string;
  questions: QuestionPlay[];
}

export default function QuizPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const courseId = resolvedParams.id;

  const [quizId, setQuizId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const [quiz, setQuiz] = useState<QuizPlay | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Read query params only on client side to prevent build errors
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setQuizId(urlParams.get("quiz_id"));
      setAttemptId(urlParams.get("attempt_id"));
    }
  }, []);

  // Timer interval
  useEffect(() => {
    if (loading || submitting) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, submitting]);

  // Load play questions
  useEffect(() => {
    if (!attemptId) return;

    async function loadQuizQuestions() {
      try {
        const res = await api.get(`/quizzes/attempts/${attemptId}/play`);
        setQuiz(res.data);
      } catch (err: any) {
        console.error("Failed to load quiz play questions:", err);
        setError("Failed to load active quiz questions. Make sure this attempt is valid.");
      } finally {
        setLoading(false);
      }
    }
    loadQuizQuestions();
  }, [attemptId]);

  // Warn before unloading/navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitting) {
        e.preventDefault();
        e.returnValue = "You have unsaved quiz progress. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [submitting]);

  const handleSelectAnswer = (questionId: string, answerText: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerText
    }));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSubmit = async () => {
    if (!quiz || !attemptId || submitting) return;

    // Confirm submit if some questions are unanswered
    const unansweredCount = quiz.questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `You have left ${unansweredCount} questions unanswered. Do you want to submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    setError(null);

    // Format answers array
    const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
      question_id: qId,
      selected_answer: val
    }));

    try {
      await api.post(`/quizzes/attempts/${attemptId}/submit`, {
        answers: formattedAnswers,
        duration_seconds: secondsElapsed
      });

      // Redirect to results page
      router.push(`/courses/${courseId}/quizzes/results?attempt_id=${attemptId}`);

    } catch (err: any) {
      console.error(err);
      setError("Failed to submit quiz results. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm text-zinc-400">Loading quiz questions...</span>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="mx-auto max-w-xl text-center py-12 space-y-4">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error || "Quiz not found"}
        </div>
        <Link href={`/courses/${courseId}/quizzes`} className="text-indigo-600 hover:underline text-sm font-semibold">
          <ArrowLeft className="h-4 w-4 inline mr-1" /> Back to Quizzes
        </Link>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const selectedAnswer = answers[currentQuestion.id] || "";

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6 px-4">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {quiz.title}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Question {currentIndex + 1} of {quiz.questions.length}
          </p>
        </div>
        
        {/* Timer */}
        <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
          <Clock className="h-4 w-4" />
          <span>{formatTime(secondsElapsed)}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Progress tracker bar */}
      <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
        <div
          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 md:p-8 dark:border-zinc-800/80 dark:bg-zinc-950 space-y-6">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wide dark:bg-zinc-900 dark:text-zinc-400">
            {currentQuestion.question_type === "mcq" && "Multiple Choice"}
            {currentQuestion.question_type === "true_false" && "True or False"}
            {currentQuestion.question_type === "short_answer" && "Fill in the Blank"}
          </span>
          <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed">
            {currentQuestion.question_text}
          </h2>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          {currentQuestion.question_type === "mcq" && currentQuestion.options && (
            <div className="grid gap-3">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAnswer(currentQuestion.id, opt)}
                    disabled={submitting}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-semibold transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/20 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                          : "border-zinc-300 dark:border-zinc-800"
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.question_type === "true_false" && (
            <div className="grid grid-cols-2 gap-4">
              {["True", "False"].map((opt) => {
                const isSelected = selectedAnswer.toLowerCase() === opt.toLowerCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectAnswer(currentQuestion.id, opt)}
                    disabled={submitting}
                    className={`rounded-xl border py-6 text-center text-sm font-bold transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/20 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.question_type === "short_answer" && (
            <div>
              <input
                type="text"
                placeholder="Type your answer here..."
                value={selectedAnswer}
                onChange={(e) => handleSelectAnswer(currentQuestion.id, e.target.value)}
                disabled={submitting}
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3.5 px-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-indigo-500 dark:focus:bg-zinc-900"
              />
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                Tip: Double-check spelling before submitting.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
          disabled={currentIndex === 0 || submitting}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>

        {currentIndex === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700 disabled:opacity-50 min-w-[130px]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                Submit Quiz <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((idx) => Math.min(quiz.questions.length - 1, idx + 1))}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
