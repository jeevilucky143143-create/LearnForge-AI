"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../../utils/api";
import {
  FileText,
  Loader2,
  Trash2,
  Save,
  ArrowRight,
  BookOpen,
  AlertCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface NoteRecord {
  id: string;
  lesson_id: string;
  lesson_title: string;
  course_id: string;
  course_title: string;
  markdown: string;
  created_at: string;
  updated_at: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState<NoteRecord | null>(null);
  const [editorText, setEditorText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const res = await api.get("/notes");
      setNotes(res.data || []);
      if (res.data && res.data.length > 0) {
        setActiveNote(res.data[0]);
        setEditorText(res.data[0].markdown);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activeNote || saving) return;
    setSaving(true);
    try {
      const res = await api.post(`/notes/lessons/${activeNote.lesson_id}`, {
        markdown: editorText
      });
      // Update local state list
      setNotes((prev) =>
        prev.map((n) => (n.lesson_id === activeNote.lesson_id ? { ...n, markdown: editorText, updated_at: res.data.updated_at } : n))
      );
      // Update active note
      setActiveNote((prev) => (prev ? { ...prev, markdown: editorText, updated_at: res.data.updated_at } : null));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this note?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/notes/lessons/${lessonId}`);
      const filtered = notes.filter((n) => n.lesson_id !== lessonId);
      setNotes(filtered);
      if (filtered.length > 0) {
        setActiveNote(filtered[0]);
        setEditorText(filtered[0].markdown);
      } else {
        setActiveNote(null);
        setEditorText("");
      }
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
          Personal Notes
        </h1>
        <p className="text-sm text-zinc-400 mt-1 dark:text-zinc-500">
          Edit and manage your markdown study notes and conceptual records.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {notes.length === 0 ? (
        <div className="mx-auto max-w-lg text-center py-16 rounded-2xl border border-zinc-200/80 bg-white p-8 dark:border-zinc-800/80 dark:bg-zinc-950 space-y-4">
          <FileText className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-700" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              No notes saved
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
              Open any course lesson and expand the notes side-drawer panel to write custom markdown notes.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700"
          >
            Go to Courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
          {/* Notes Sidebar Selector */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {notes.map((note) => {
              const isActive = activeNote?.lesson_id === note.lesson_id;
              return (
                <button
                  key={note.id}
                  onClick={() => {
                    setActiveNote(note);
                    setEditorText(note.markdown);
                  }}
                  className={`w-full text-left rounded-xl border p-4 transition-all space-y-2 ${
                    isActive
                      ? "border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/20"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide truncate max-w-[120px]">
                      {note.course_title}
                    </span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate">
                    {note.lesson_title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 line-clamp-1 leading-relaxed dark:text-zinc-500">
                    {note.markdown}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Note Workspace Editor */}
          {activeNote && (
            <div className="lg:col-span-2 rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-950 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-900">
                <div>
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {activeNote.course_title}
                  </div>
                  <h3 className="font-extrabold text-zinc-950 dark:text-zinc-100 mt-0.5 text-base">
                    {activeNote.lesson_title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(activeNote.lesson_id)}
                    className="p-2 text-zinc-400 hover:text-red-500 rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-850 dark:hover:bg-zinc-900"
                    title="Delete Note"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1 bg-zinc-950 text-white rounded-xl py-2 px-4 text-xs font-semibold hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Note
                  </button>
                </div>
              </div>

              {/* Edit workspace */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Markdown Editor
                  </label>
                  <textarea
                    value={editorText}
                    onChange={(e) => setEditorText(e.target.value)}
                    className="w-full h-[320px] rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 focus:bg-white resize-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
                    placeholder="Type notes in Markdown here..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Live Preview
                  </label>
                  <div className="w-full h-[320px] rounded-xl border border-zinc-200 bg-zinc-50/30 p-4 overflow-y-auto text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900/30 prose prose-xs dark:prose-invert max-w-none">
                    {editorText ? (
                      <ReactMarkdown>{editorText}</ReactMarkdown>
                    ) : (
                      <span className="text-zinc-400 italic">Preview is empty.</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Link
                  href={`/courses/${activeNote.course_id}/lessons/${activeNote.lesson_id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View full topic content <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
