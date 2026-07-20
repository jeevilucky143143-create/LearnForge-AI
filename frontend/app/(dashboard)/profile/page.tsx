"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";
import { User, Mail, Calendar, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters long"),
});

type ProfileSchemaType = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileSchemaType>({
    resolver: zodResolver(profileSchema),
  });

  // Pre-populate name when user context loads
  useEffect(() => {
    if (user) {
      setValue("fullName", user.full_name);
    }
  }, [user, setValue]);

  const onSubmit = async (data: ProfileSchemaType) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await api.patch("/users/me", {
        full_name: data.fullName,
      });
      updateUser(res.data.full_name);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile name.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Profile Settings
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your personal display details
        </p>
      </div>

      {/* Profile Visual Row */}
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-zinc-200/80 bg-white p-6 md:flex-row dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/10">
          {user ? getInitials(user.full_name) : "U"}
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {user?.full_name}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {user?.email}
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <Calendar className="h-4 w-4" />
            Joined {user ? new Date(user.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
            }) : "N/A"}
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950">
        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5 shrink-0" />
            Profile name updated successfully!
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="fullName">
              Full Name
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <User className="h-5 w-5" />
              </span>
              <input
                id="fullName"
                type="text"
                className={`block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-indigo-500 dark:focus:bg-zinc-900 ${
                  errors.fullName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                }`}
                {...register("fullName")}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 dark:text-zinc-500" htmlFor="email">
              Email Address (Read-only)
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="email"
                type="email"
                disabled
                value={user?.email || ""}
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-100/50 py-3 pl-10 pr-4 text-sm text-zinc-500 outline-none dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
