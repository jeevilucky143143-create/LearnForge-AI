"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import api from "../../../utils/api";

export default function UploadPage() {
  const router = useRouter();
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Polling states
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [generatedCourseId, setGeneratedCourseId] = useState<string | null>(null);

  // Read query params only on client side to prevent Next.js build Suspense errors
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("pdf_id");
      setPdfId(id);
    }
  }, []);

  // Polling loop
  useEffect(() => {
    if (!pdfId) return;

    let isMounted = true;
    setPollingStatus("pending");
    setPollingError(null);

    const checkStatus = async () => {
      try {
        const res = await api.get(`/pdfs/${pdfId}`);
        if (!isMounted) return;

        const { status, error_message, course_id } = res.data;
        setPollingStatus(status);
        setPollingError(error_message);

        if (status === "completed" && course_id) {
          setGeneratedCourseId(course_id);
          // Redirect to the newly generated course
          setTimeout(() => {
            router.push(`/courses/${course_id}`);
          }, 1500);
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pdfId, router]);

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      return "Only PDF files are allowed.";
    }
    const maxSizeMB = 50;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be under ${maxSizeMB}MB.`;
    }
    if (file.size === 0) {
      return "File cannot be empty.";
    }
    return null;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (title) formData.append("title", title);
    formData.append("difficulty", difficulty);

    try {
      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        },
      });

      const newPdfId = res.data.id;
      // Set query param to trigger polling view
      window.location.search = `?pdf_id=${newPdfId}`;

    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.response?.data?.detail || "An error occurred during upload.");
      setIsUploading(false);
    }
  };

  const handleRetryGeneration = async () => {
    if (!pdfId) return;
    setPollingStatus("pending");
    setPollingError(null);
    try {
      await api.post(`/pdfs/${pdfId}/generate`);
    } catch (err: any) {
      setPollingError(err.response?.data?.detail || "Failed to restart generation.");
      setPollingStatus("failed");
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setTitle("");
    setError(null);
    setIsUploading(false);
    window.location.search = "";
  };

  // Render Polling / Processing View
  if (pdfId) {
    const isCompleted = pollingStatus === "completed";
    const isFailed = pollingStatus === "failed";
    const isProcessing = pollingStatus === "processing" || pollingStatus === "uploaded" || pollingStatus === "pending";

    return (
      <div className="mx-auto max-w-xl text-center py-12 px-4 space-y-6">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-white p-8 dark:border-zinc-800/80 dark:bg-zinc-950">
          {isProcessing && (
            <div className="relative flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
          )}

          {isCompleted && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle className="h-6 w-6" />
            </div>
          )}

          {isFailed && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
          )}

          <h2 className="mt-6 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {isProcessing && "Processing PDF & Generating Course"}
            {isCompleted && "Course Generated Successfully!"}
            {isFailed && "Course Generation Failed"}
          </h2>

          <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto dark:text-zinc-400">
            {isProcessing && "AI is currently extracting text and organizing chapters and lessons. This can take up to a minute..."}
            {isCompleted && "Redirecting you to your interactive lessons now..."}
            {isFailed && (pollingError || "An unexpected error occurred during course construction.")}
          </p>

          {isFailed && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={resetUpload}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" /> Upload Different File
              </button>
              <button
                onClick={handleRetryGeneration}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
              >
                <RefreshCw className="h-4 w-4" /> Retry Generation
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Upload Form View
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Upload PDF Document
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Convert static reference documents into structured AI courses
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drag & Drop Box */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 px-6 text-center transition-all overflow-hidden ${
            dragActive
              ? "border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/20"
              : "border-zinc-200 bg-white hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950"
          } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
        >
          {isUploading && (
            <div
              className="absolute bottom-0 left-0 h-1 bg-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          )}

          <input
            type="file"
            id="file-upload"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            {selectedFile ? <FileText className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
          </div>

          {selectedFile ? (
            <div className="mt-4">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
              </p>
              {isUploading && (
                <p className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Uploading... {uploadProgress}%
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Click to upload
              </label>
              <span className="text-sm text-zinc-500 dark:text-zinc-400"> or drag and drop</span>
              <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                PDF documents up to 50MB
              </p>
            </div>
          )}
        </div>

        {/* Form Options */}
        <div className={`rounded-2xl border border-zinc-200/80 bg-white p-6 space-y-5 dark:border-zinc-800/80 dark:bg-zinc-950 ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="course-title">
              Course Title (Optional)
            </label>
            <input
              id="course-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Physics"
              className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-all placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-indigo-500 dark:focus:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Difficulty Level
            </label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {[
                { id: "beginner", label: "Beginner" },
                { id: "intermediate", label: "Intermediate" },
                { id: "advanced", label: "Advanced" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDifficulty(opt.id)}
                  className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                    difficulty === opt.id
                      ? "border-indigo-600 bg-indigo-50/30 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50 min-w-[160px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              "Upload and Generate"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
