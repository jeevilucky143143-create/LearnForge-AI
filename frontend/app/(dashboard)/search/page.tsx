"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../../utils/api";
import {
  Search,
  BookOpen,
  ArrowRight,
  Loader2,
  Trash2,
  AlertCircle,
  HelpCircle,
  FileText
} from "lucide-react";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  course_title: string;
  snippet?: string;
  course_id: string;
}

interface RecentSearch {
  id: string;
  query: string;
  searched_at: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isSemantic, setIsSemantic] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const res = await api.get("/search/recent");
      setRecentSearches(res.data || []);
    } catch (err) {
      console.error("Failed to load recent searches:", err);
    }
  };

  const handleSearch = async (searchQuery: string, semantic: boolean = isSemantic) => {
    if (!searchQuery.strip()) return;
    setLoading(true);
    setError(null);
    try {
      const endpoint = semantic ? "/search/semantic" : "/search";
      const res = await api.get(endpoint, {
        params: { q: searchQuery }
      });
      setResults(res.data || []);
      loadRecentSearches();
    } catch (err) {
      console.error(err);
      setError("An error occurred while executing the search.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.post("/search/recent/clear");
      setRecentSearches([]);
    } catch (err) {
      console.error(err);
    }
  };

  const triggerSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
          Search Curriculum
        </h1>
        <p className="text-sm text-zinc-400 mt-1 dark:text-zinc-500">
          Find topics, definitions, or lessons instantly using keyword queries or semantic matching.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
        {/* Search controls & results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-950">
            <form onSubmit={triggerSearchSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder={isSemantic ? "Ask conceptually, e.g. 'Find lessons about Neural Networks'" : "Enter keywords..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3.5 pl-11 pr-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-all focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-indigo-500 dark:focus:bg-zinc-900"
                />
                <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-400" />
              </div>

              <div className="flex items-center justify-between">
                {/* Semantic search toggle */}
                <button
                  type="button"
                  onClick={() => setIsSemantic(!isSemantic)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                    isSemantic
                      ? "border-indigo-600 bg-indigo-50/30 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400"
                      : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                  }`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Semantic Match {isSemantic ? "On" : "Off"}
                </button>

                <button
                  type="submit"
                  disabled={loading || !query.strip()}
                  className="rounded-xl bg-indigo-600 px-6 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700 disabled:opacity-40"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Results Panel */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : results.length === 0 ? (
              query.strip() ? (
                <div className="rounded-2xl border border-zinc-100 bg-white p-8 text-center text-zinc-400 dark:border-zinc-900 dark:bg-zinc-950">
                  <Search className="h-8 w-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
                  <p className="text-xs">No matching results found for "{query}".</p>
                </div>
              ) : null
            ) : (
              <div className="space-y-4">
                {results.map((res) => (
                  <div
                    key={`${res.type}-${res.id}`}
                    className="rounded-2xl border border-zinc-200/80 bg-white p-5 hover:shadow-md transition-all dark:border-zinc-800/80 dark:bg-zinc-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-zinc-50 px-2 py-0.5 text-[9px] font-bold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 uppercase tracking-wide">
                          {res.type}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold truncate max-w-[200px]">
                          {res.course_title}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed truncate">
                        {res.title}
                      </h3>
                      {res.snippet && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                          {res.snippet}
                        </p>
                      )}
                    </div>
                    
                    <Link
                      href={
                        res.type === "lesson"
                          ? `/courses/${res.course_id}/lessons/${res.id}`
                          : `/courses/${res.course_id}`
                      }
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline shrink-0 dark:text-indigo-400"
                    >
                      Open {res.type === "lesson" ? "Lesson" : "Course"} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* History panel */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-950 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
              Recent Searches
            </h3>
            {recentSearches.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-0.5"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          {recentSearches.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-6 dark:text-zinc-500">
              Your search history is empty.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((history) => (
                <button
                  key={history.id}
                  onClick={() => {
                    setQuery(history.query);
                    handleSearch(history.query);
                  }}
                  className="rounded-full bg-zinc-50 border border-zinc-100 px-3.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {history.query}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add string utility block for safety
declare global {
  interface String {
    strip(): string;
  }
}

if (!String.prototype.strip) {
  String.prototype.strip = function () {
    return this.trim();
  };
}
