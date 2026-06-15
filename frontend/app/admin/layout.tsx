"use client";

import React, { useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, LayoutDashboard, Film, Users, Home, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/sign-in");
      } else if (user.role !== "admin") {
        toast.error("Access Denied: Admin privileges required.");
        router.replace("/");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-secondary text-text-primary">
      <Suspense fallback={<div className="h-14 bg-white border-b border-border w-full fixed top-0 left-0" />}>
        <Navbar />
      </Suspense>
      <div className="flex flex-1 pt-14">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-white border-r border-border hidden md:block">
          <div className="p-4 border-b border-border flex items-center gap-2 text-primary">
            <Shield size={18} fill="rgba(255,0,0,0.1)" />
            <span className="font-bold text-xs uppercase tracking-wider">Admin Control</span>
          </div>
          <nav className="p-4 space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:bg-cardHover hover:text-text-primary transition-colors"
            >
              <LayoutDashboard size={16} />
              <span>Dashboard Overview</span>
            </Link>
            <Link
              href="/admin/videos"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:bg-cardHover hover:text-text-primary transition-colors"
            >
              <Film size={16} />
              <span>Manage Videos</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:bg-cardHover hover:text-text-primary transition-colors"
            >
              <Users size={16} />
              <span>Manage Users</span>
            </Link>
            <div className="border-t border-border my-4 pt-4">
              <Link
                href="/"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:bg-cardHover hover:text-text-primary transition-colors"
              >
                <Home size={16} />
                <span>Return Home</span>
              </Link>
            </div>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}
