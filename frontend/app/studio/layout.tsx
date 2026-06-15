"use client";

import React, { useEffect, Suspense } from "react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/sign-in");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-secondary">
      <Suspense fallback={<div className="h-14 bg-white border-b border-border w-full fixed top-0 left-0" />}>
        <Navbar />
      </Suspense>
      <main className="flex-grow pt-14 px-4 py-6 sm:px-6 md:px-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
