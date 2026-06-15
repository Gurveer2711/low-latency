"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 30, // 30 seconds
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#333",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
          },
          success: {
            style: {
              background: "#10B981", // Green for success
            },
          },
          error: {
            style: {
              background: "#EF4444", // Red for error
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
