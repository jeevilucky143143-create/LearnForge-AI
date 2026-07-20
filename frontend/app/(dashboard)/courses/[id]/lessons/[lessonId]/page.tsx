"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import api from "../../../../../../utils/api";
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
  Loader2,
  ChevronLeft,
  Compass,
  Bookmark,
  FileText,
  Save
} from "lucide-react";

interface LessonOut {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
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

interface LessonDetail {
  id: string;
  chapter_id: string;
  course_id: string;
  title: string;
  content: string;
  order_index: number;
  completed: boolean;
}

export default function LessonViewerPage({
  params
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const courseId = resolvedParams.id;
  const lessonId = resolvedParams.lessonId;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Bookmarks & Notes state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [notesMode, setNotesMode] = useState<"edit" | "preview">("edit");

  const topRef = useRef<HTMLDivElement>(null);

  // Scroll to top whenever lesson changes
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lessonId]);

  // Load Course outline (sidebar) once
  useEffect(() => {
    async function fetchCourseOutline() {
      try {
        const res = await api.get(`/courses/${courseId}`);
        setCourse(res.data);
      } catch (err) {
        console.error("Outline load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourseOutline();
  }, [courseId]);

  // Load current Lesson content, note, and bookmark status
  useEffect(() => {
    async function fetchLessonAndPersonalData() {
      setLessonLoading(true);
      try {
        const [lessonRes, noteRes, bookmarksRes] = await Promise.all([
          api.get(`/courses/${courseId}/lessons/${lessonId}`),
          api.get(`/notes/lessons/${lessonId}`),
          api.get(`/bookmarks`)
        ]);
        
        setLesson(lessonRes.data);
        
        // Note
        if (noteRes.data) {
          setNoteText(noteRes.data.markdown);
        } else {
          setNoteText("");
        }

        // Bookmark status
        const isBookmarkedMatch = (bookmarksRes.data || []).some(
          (bm: any) => bm.lesson_id === lessonId
        );
        setIsBookmarked(isBookmarkedMatch);

      } catch (err) {
        console.error("Lesson data details load failed:", err);
      } finally {
        setLessonLoading(false);
      }
    }
    fetchLessonAndPersonalData();
  }, [courseId, lessonId]);

  const handleToggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${lessonId}`);
        setIsBookmarked(false);
      } else {
        await api.post(`/bookmarks`, { lesson_id: lessonId });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await api.post(`/notes/lessons/${lessonId}`, {
        markdown: noteText
      });
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  // Toggle progress completion
  const handleToggleComplete = async () => {
    if (!lesson || isUpdatingProgress) return;
    setIsUpdatingProgress(true);
    const nextCompletedState = !lesson.completed;

    try {
      await api.post(`/courses/${courseId}/lessons/${lessonId}/progress`, {
        completed: nextCompletedState
      });
      
      // Update local state
      setLesson(prev => prev ? { ...prev, completed: nextCompletedState } : null);

      // Sync the course sidebar state
      setCourse(prev => {
        if (!prev) return null;
        const updatedChapters = prev.chapters.map(ch => {
          const updatedLessons = ch.lessons.map(les => {
            if (les.id === lessonId) {
              return { ...les, completed: nextCompletedState };
            }
            return les;
          });
          return { ...ch, lessons: updatedLessons };
        });
        return { ...prev, chapters: updatedChapters };
      });
    } catch (err) {
      console.error("Failed to update progress:", err);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  if (loading || !course) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Find previous/next lessons by flattening course structure
  const flatLessons: { id: string; title: string }[] = [];
  course.chapters.forEach(ch => {
    ch.lessons.forEach(l => {
      flatLessons.push({ id: l.id, title: l.title });
    });
  });

  const currentIndex = flatLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950">
      <div ref={topRef} />

      {/* Mobile Sidebar Hamburger overlay trigger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg md:hidden hover:bg-indigo-700 active:scale-95"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Sidebar Overlay (Mobile Drawer / Desktop Fixed) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-zinc-200 bg-white transition-transform duration-300 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0 dark:border-zinc-800 dark:bg-zinc-950 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-6 dark:border-zinc-900">
          <span className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
            <Compass className="h-4 w-4 text-indigo-500" /> Course Syllabus
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-[calc(100vh-8.5rem)] overflow-y-auto p-4 space-y-6">
          {course.chapters.map(ch => (
            <div key={ch.id} className="space-y-2">
              <h4 className="px-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                CH {ch.order_index}: {ch.title}
              </h4>
              <div className="space-y-0.5">
                {ch.lessons.map(les => {
                  const isActive = les.id === lessonId;
                  return (
                    <Link
                      key={les.id}
                      href={`/courses/${courseId}/lessons/${les.id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                          : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={les.completed}
                        readOnly
                        className="h-3.5 w-3.5 rounded border-zinc-300 text-indigo-600 accent-indigo-600 dark:border-zinc-800"
                      />
                      <span className="truncate">{les.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col p-4 md:p-8 max-w-4xl mx-auto w-full">
        {lessonLoading || !lesson ? (
          <div className="flex h-[40vh] flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-sm text-zinc-400">Loading lesson content...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-900">
                <Link
                  href={`/courses/${courseId}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Course Overview
                </Link>
                
                <div className="flex items-center gap-2">
                  {/* Bookmark Button */}
                  <button
                    onClick={handleToggleBookmark}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isBookmarked
                        ? "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                    }`}
                    title={isBookmarked ? "Remove Bookmark" : "Bookmark Lesson"}
                  >
                    <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>

                  {/* Notes Sidebar Toggle Button */}
                  <button
                    onClick={() => setNotesOpen(!notesOpen)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      notesOpen
                        ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                    }`}
                    title="Toggle Personal Notes"
                  >
                    <FileText className="h-4 w-4" />
                  </button>

                  {/* Complete Button */}
                  <button
                    onClick={handleToggleComplete}
                    disabled={isUpdatingProgress}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                      lesson.completed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {isUpdatingProgress ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className={`h-3.5 w-3.5 ${lesson.completed ? "fill-emerald-600 text-white dark:fill-emerald-400 dark:text-zinc-950" : ""}`} />
                    )}
                    {lesson.completed ? "Completed" : "Mark as Complete"}
                  </button>
                </div>
              </div>

              {/* Lesson body */}
              <article className="space-y-4">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {lesson.title}
                </h1>
                
                {/* Render Markdown using react-markdown */}
                <div className="prose prose-zinc dark:prose-invert max-w-none prose-sm sm:prose-base pt-4 prose-headings:font-bold prose-a:text-indigo-600 dark:prose-a:text-indigo-400 leading-relaxed">
                  <ReactMarkdown>{lesson.content || ""}</ReactMarkdown>
                </div>
              </article>
            </div>

            {/* Bottom Lesson Footer Navigation */}
            <div className="flex justify-between items-center border-t border-zinc-100 pt-6 mt-12 dark:border-zinc-900">
              {prevLesson ? (
                <button
                  onClick={() => router.push(`/courses/${courseId}/lessons/${prevLesson.id}`)}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <button
                  onClick={() => router.push(`/courses/${courseId}/lessons/${nextLesson.id}`)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  href={`/courses/${courseId}`}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-700"
                >
                  Finish Course
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Notes Drawer */}
      {notesOpen && (
        <div className="fixed inset-y-0 right-0 z-40 w-80 border-l border-zinc-200 bg-white p-5 space-y-4 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col justify-between md:sticky md:top-16 md:h-[calc(100vh-4rem)] shrink-0">
          <div className="flex h-14 items-center justify-between border-b border-zinc-100 dark:border-zinc-900">
            <span className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-zinc-50">
              <FileText className="h-4.5 w-4.5 text-indigo-500" /> Lesson Notes
            </span>
            <button
              onClick={() => setNotesOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col space-y-3 pt-2 min-h-0">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-900">
              {["edit", "preview"].map((m) => (
                <button
                  key={m}
                  onClick={() => setNotesMode(m as any)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded transition-all uppercase ${
                    notesMode === m
                      ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {notesMode === "edit" ? (
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write lesson notes in Markdown here..."
                className="w-full flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 focus:bg-white resize-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
              />
            ) : (
              <div className="w-full flex-1 rounded-xl border border-zinc-200 bg-zinc-50/30 p-4 overflow-y-auto text-xs leading-relaxed prose prose-xs dark:prose-invert max-w-none dark:border-zinc-800 dark:bg-zinc-900/30">
                {noteText ? (
                  <ReactMarkdown>{noteText}</ReactMarkdown>
                ) : (
                  <span className="text-zinc-400 italic">Notes are empty.</span>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              className="flex items-center justify-center gap-1.5 bg-zinc-950 text-white rounded-xl py-2.5 px-4 text-xs font-semibold hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 w-full"
            >
              {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
