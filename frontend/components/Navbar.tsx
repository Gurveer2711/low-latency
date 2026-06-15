"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { Play, Search, Video, ShieldAlert, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center justify-between px-4 sm:px-6">
      {/* Left logo */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-1.5 group select-none">
          <div className="bg-primary text-white p-1.5 rounded-lg transition-transform group-hover:scale-110 duration-200">
            <Play size={16} fill="white" className="ml-0.5" />
          </div>
          <span className="font-semibold text-lg text-text-primary tracking-tight">
            View<span className="text-primary">Tube</span>
          </span>
        </Link>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-1 max-w-[500px] mx-4 items-center border border-border rounded-full bg-background-secondary hover:border-gray-300 transition-colors"
      >
        <input
          type="text"
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow bg-transparent px-4 py-1.5 text-sm text-text-primary placeholder-gray-400 outline-none w-full"
        />
        <button
          type="submit"
          className="flex items-center justify-center border-l border-border px-5 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-text-primary rounded-r-full transition-colors"
        >
          <Search size={16} />
        </button>
      </form>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-full" />
        ) : user ? (
          <div className="flex items-center gap-3">
            {/* Studio / Upload link */}
            <Link
              href="/studio"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary hover:bg-cardHover hover:text-text-primary transition-all"
            >
              <Video size={16} className="text-text-secondary" />
              <span className="hidden md:inline">Studio</span>
            </Link>

            {/* Admin Portal link */}
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-primary bg-red-50 hover:bg-red-100 transition-all border border-red-100"
              >
                <ShieldAlert size={16} />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}

            {/* User Details & Sign Out */}
            <div className="flex items-center gap-2 border-l border-border pl-3">
              <div className="flex flex-col text-right hidden lg:flex">
                <span className="text-xs font-semibold text-text-primary truncate max-w-[120px]">
                  {user.email.split("@")[0]}
                </span>
                <span className="text-[10px] text-gray-500 capitalize">{user.role}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold select-none uppercase shadow-sm">
                {user.email[0]}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-text-secondary hover:text-primary hover:bg-red-50 rounded-full transition-colors ml-1"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="px-3 py-1.5 text-sm font-medium border border-border hover:bg-cardHover rounded-full transition-colors text-text-primary"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-3 py-1.5 text-sm font-medium bg-primary hover:bg-red-600 text-white rounded-full transition-colors shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
