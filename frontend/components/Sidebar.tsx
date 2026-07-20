"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  UploadCloud,
  User,
  Settings,
  LogOut,
  GraduationCap,
  X,
  Search,
  Bookmark,
  FileText,
  BarChart2
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Courses", href: "/courses", icon: BookOpen },
    { name: "Upload PDF", href: "/upload", icon: UploadCloud },
    { name: "Search", href: "/search", icon: Search },
    { name: "Bookmarks", href: "/bookmarks", icon: Bookmark },
    { name: "Personal Notes", href: "/notes", icon: FileText },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-zinc-200/80 px-4 py-6 dark:bg-zinc-950 dark:border-zinc-800/80">
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="h-5.5 w-5.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              PDF2Course
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div>
        <button
          onClick={() => {
            onClose();
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all dark:text-red-400 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-5 w-5 text-red-500 dark:text-red-400" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-zinc-900/30 backdrop-blur-xs transition-opacity duration-300 dark:bg-black/50"
        />

        {/* Sliding Panel */}
        <div
          className={`absolute inset-y-0 left-0 flex w-72 max-w-full transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full w-full">{sidebarContent}</div>
        </div>
      </div>
    </>
  );
}
