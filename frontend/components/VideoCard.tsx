"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Video } from "../types";
import { formatTimeAgo } from "../lib/utils";
import { PlayCircle, Clock } from "lucide-react";

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  // Query to fetch the presigned thumbnail URL
  const { data: thumbUrl, isLoading: loadingThumb } = useQuery<string | null>({
    queryKey: ["video-thumbnail-signed", video.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/videos/${video.id}/play?format=480p`);
        return response.data.thumbUrl || null;
      } catch {
        return null;
      }
    },
    enabled: !!video.thumbKey,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  return (
    <Link href={`/watch/${video.id}`} className="group flex flex-col gap-2 cursor-pointer">
      {/* Thumbnail Wrapper */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-200 border border-border transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
        {video.thumbKey && thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={video.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gray-900 text-gray-400 gap-1.5 p-4 text-center">
            {loadingThumb ? (
              <span className="inline-block border-2 border-gray-400 border-t-transparent animate-spin rounded-full h-5 w-5" />
            ) : (
              <>
                <PlayCircle size={32} className="opacity-60" />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-60">
                  {video.status === "processing" ? "Processing..." : "No Thumbnail"}
                </span>
              </>
            )}
          </div>
        )}

        {/* Hover duration/play indicator */}
        <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <PlayCircle className="text-white drop-shadow-md" size={36} fill="rgba(0,0,0,0.2)" />
        </div>
      </div>

      {/* Info Metadata */}
      <div className="flex gap-3 px-1 mt-1">
        {/* Creator avatar placeholder */}
        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-red-100 text-primary font-bold flex items-center justify-center text-sm">
          {video.user?.email ? video.user.email[0].toUpperCase() : "V"}
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-tight group-hover:text-primary transition-colors pr-2">
            {video.title}
          </h3>
          <p className="text-xs text-text-secondary mt-1 font-medium truncate">
            {video.user?.email || "ViewTube Creator"}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5">
            <Clock size={12} className="opacity-70" />
            <span>{formatTimeAgo(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
