"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../../utils/api";
import {
  Bookmark,
  ArrowRight,
  Loader2,
  Trash2,
  BookOpen,
  FileText
} from "lucide-react";

interface BookmarkRecord {
  id: string;
  lesson_id: string;
  lesson_title: string;
  course_id: string;
  course_title: string;
  created_at: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const res = await api.get("/bookmarks");
      setBookmarks(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookmarks.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (lessonId: string) => {
    try {
      await api.delete(`/bookmarks/${lessonId}`);
      setBookmarks((prev) => prev.filter((bm) => bm.lesson_id !== lessonId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
          Bookmarked Topics
        </h1>
        <p className="text-sm text-zinc-400 mt-1 dark:text-zinc-500">
          Review your pinned lessons and study modules across courses.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {bookmarks.length === 0 ? (
        <div className="mx-auto max-w-lg text-center py-16 rounded-2xl border border-zinc-200/80 bg-white p-8 dark:border-zinc-800/80 dark:bg-zinc-950 space-y-4">
          <Bookmark className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-700" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              No bookmarks pinned
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
              You can bookmark topics directly inside the lesson reading layout to view them here.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700"
          >
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 hover:shadow-md transition-all dark:border-zinc-800/80 dark:bg-zinc-950 flex flex-col justify-between h-[150px]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide truncate max-w-[200px]">
                    {bm.course_title}
                  </span>
                  <button
                    onClick={() => handleRemoveBookmark(bm.lesson_id)}
                    className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed line-clamp-2">
                  {bm.lesson_title}
                </h3>
              </div>
              
              <div className="flex justify-end pt-3 border-t border-zinc-100/60 dark:border-zinc-900/60">
                <Link
                  href={`/courses/${bm.course_id}/lessons/${bm.lesson_id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Start Reading <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
