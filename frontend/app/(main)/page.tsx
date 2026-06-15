"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePublicVideos } from "../../hooks/useVideos";
import VideoGrid from "../../components/VideoGrid";

function HomeContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const { data: videos, isLoading } = usePublicVideos();

  // Filter videos that have a thumbnail (meaning they are processed) and match the query q
  const filteredVideos = React.useMemo(() => {
    if (!videos) return [];
    return videos.filter((video) => {
      const matchesSearch = q
        ? video.title.toLowerCase().includes(q.toLowerCase()) ||
          (video.description && video.description.toLowerCase().includes(q.toLowerCase()))
        : true;
      
      // Homepage shows public videos that are fully processed (has thumbKey)
      return matchesSearch && video.thumbKey !== null;
    });
  }, [videos, q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight md:text-2xl">
          {q ? `Search results for "${q}"` : "Recommended Videos"}
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {q 
            ? `Found ${filteredVideos.length} matching streams` 
            : "Explore ultra low-latency video feeds transcoded in real time."}
        </p>
      </div>

      <VideoGrid videos={filteredVideos} isLoading={isLoading} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 animate-pulse rounded w-1/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-3 animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-gray-200" />
                <div className="flex gap-3 px-1">
                  <div className="h-9 w-9 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-11/12" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
