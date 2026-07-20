"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Bell, Sun, Moon, Laptop, Menu, ChevronDown, User, LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface TopNavbarProps {
  onMenuClick: () => void;
}

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5 text-amber-500" />;
      case "dark":
        return <Moon className="h-5 w-5 text-indigo-400" />;
      default:
        return <Laptop className="h-5 w-5 text-zinc-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80 md:px-6">
      {/* Left: Mobile hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Right: Notifications, Theme Toggle, User profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button className="relative rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-zinc-950" />
        </button>

        {/* Theme Select */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
          >
            {getThemeIcon()}
          </button>
          {showThemeMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowThemeMenu(false)} />
              <div className="absolute right-0 mt-2 z-20 w-36 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                <button
                  onClick={() => {
                    setTheme("light");
                    setShowThemeMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <Sun className="h-4 w-4 text-amber-500" /> Light
                </button>
                <button
                  onClick={() => {
                    setTheme("dark");
                    setShowThemeMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <Moon className="h-4 w-4 text-indigo-400" /> Dark
                </button>
                <button
                  onClick={() => {
                    setTheme("system");
                    setShowThemeMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <Laptop className="h-4 w-4 text-zinc-500" /> System
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-1.5 pr-2.5 transition-all hover:bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-semibold text-white shadow-sm shadow-indigo-600/10">
              {user ? getInitials(user.full_name) : "U"}
            </div>
            <span className="hidden max-w-[120px] truncate text-sm font-semibold text-zinc-700 md:block dark:text-zinc-300">
              {user ? user.full_name : "User"}
            </span>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 z-20 w-48 rounded-xl border border-zinc-200 bg-white py-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
                  <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {user?.full_name}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {user?.email}
                  </p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <User className="h-4 w-4 text-zinc-400" /> My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <Settings className="h-4 w-4 text-zinc-400" /> Settings
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                >
                  <LogOut className="h-4 w-4 text-red-500" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
