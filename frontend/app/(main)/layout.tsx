import React, { Suspense } from "react";
import Navbar from "../../components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<div className="h-14 bg-white border-b border-border w-full fixed top-0 left-0" />}>
        <Navbar />
      </Suspense>
      <main className="flex-grow pt-14 px-4 py-6 sm:px-6 md:px-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
