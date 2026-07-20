"use client";

import React, { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { Sun, Moon, Laptop, Bell, Shield, Eye, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [reminders, setReminders] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Configure theme preferences and system notifications
        </p>
      </div>

      {/* Theme Section */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <Eye className="h-5 w-5 text-indigo-500" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Appearance
          </h2>
        </div>
        <div className="mt-6">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Interface Theme
          </label>
          <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
            Customize how PDF2Course looks on your device.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { id: "light", label: "Light", icon: Sun, color: "text-amber-500" },
              { id: "dark", label: "Dark", icon: Moon, color: "text-indigo-400" },
              { id: "system", label: "System", icon: Laptop, color: "text-zinc-500" },
            ].map((option) => {
              const isSelected = theme === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id as any)}
                  className={`flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  }`}
                >
                  <option.icon className={`h-6 w-6 ${option.color}`} />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <Bell className="h-5 w-5 text-indigo-500" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Notifications
          </h2>
        </div>
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Email Digests
              </label>
              <p className="text-xs text-zinc-500 mt-0.5 dark:text-zinc-400">
                Receive weekly learning highlights and course digests.
              </p>
            </div>
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                emailAlerts ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  emailAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <div>
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Study Reminders
              </label>
              <p className="text-xs text-zinc-500 mt-0.5 dark:text-zinc-400">
                Remind me to study if I have pending lessons.
              </p>
            </div>
            <button
              onClick={() => setReminders(!reminders)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                reminders ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  reminders ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="rounded-2xl border border-red-200/50 bg-white p-6 shadow-xs dark:border-red-900/30 dark:bg-zinc-950">
        <div className="flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <Shield className="h-5 w-5 text-red-500 dark:text-red-400" />
          <h2 className="text-base font-bold text-red-600 dark:text-red-400">
            Danger Zone
          </h2>
        </div>
        <div className="mt-6 flex flex-col justify-between sm:flex-row sm:items-center">
          <div>
            <h4 className="text-sm font-semibold text-zinc-850 dark:text-zinc-200">
              Delete Account
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5 dark:text-zinc-400">
              Permanently delete all your generated courses, uploaded PDFs, and statistics.
            </p>
          </div>
          <button
            disabled
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-95 disabled:pointer-events-none disabled:opacity-40 sm:mt-0 dark:bg-red-950/20 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
