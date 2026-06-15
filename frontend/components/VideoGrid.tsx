"use client";

import React from "react";
import VideoCard from "./VideoCard";
import { Video } from "../types";
import { HelpCircle } from "lucide-react";

interface VideoGridProps {
  videos: Video[];
  isLoading: boolean;
}

export default function VideoGrid({ videos, isLoading }: VideoGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3 animate-pulse">
            {/* Thumbnail Skeleton */}
            <div className="aspect-video w-full rounded-xl bg-gray-200" />
            {/* Info Skeleton */}
            <div className="flex gap-3 px-1">
              <div className="h-9 w-9 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-11/12" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-border rounded-2xl shadow-sm max-w-lg mx-auto mt-10">
        <div className="h-16 w-16 bg-red-50 text-primary rounded-full flex items-center justify-center mb-4">
          <HelpCircle size={32} />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">No videos found</h3>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Be the first to upload a video! Head to the Studio page and upload your MP4 file to begin streaming.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
