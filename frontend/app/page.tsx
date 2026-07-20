"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { BookOpen, GraduationCap, LayoutDashboard, LogIn, ArrowRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              PDF2Course
            </span>
          </div>

          <nav className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 hover:bg-indigo-700"
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-6 py-20 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
              Transform static PDFs into{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                interactive learning journeys
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Upload any textbook, research paper, or lecture slides. Our AI automatically compiles structured chapters, generates interactive lessons, quizzes you to test your knowledge, and answers questions as your personal tutor.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {user ? (
                <Link
                  href="/dashboard"
                  className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700"
                >
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700"
                  >
                    Start for Free
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/login"
                    className="text-base font-semibold leading-7 text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
                  >
                    Sign in to your account <span aria-hidden="true">→</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="border-t border-zinc-200/50 bg-zinc-100/50 py-16 dark:border-zinc-800/50 dark:bg-zinc-900/20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
                Core Features
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
                Learn smarter, not harder
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    Structured Lessons
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600 dark:text-zinc-400">
                    <p className="flex-auto">
                      AI maps out your PDF into logical chapters, ordering concepts progressively to guarantee smooth comprehension.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    Interactive Quizzes
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600 dark:text-zinc-400">
                    <p className="flex-auto">
                      Test your understanding at the end of each module with custom quizzes generated specifically from the text content.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                      <LayoutDashboard className="h-6 w-6" />
                    </div>
                    Study Statistics
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600 dark:text-zinc-400">
                    <p className="flex-auto">
                      Monitor your completion rates, review study time duration, and track your overall performance indicators.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} PDF2Course. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
