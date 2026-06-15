"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useVideoPlayback, usePublicVideos } from "@/hooks/useVideos";
import VideoPlayer from "@/components/VideoPlayer";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import { PlayCircle, Calendar, RefreshCw } from "lucide-react";
import { Video } from "@/types";

export default function WatchPage() {
  const params = useParams();
  const videoId = typeof params.id === "string" ? params.id : "";

  const {
    playbackResponse,
    availableQualities,
    selectedQuality,
    changeQuality,
    loading,
    error,
    refetch,
  } = useVideoPlayback(videoId);

  const { data: publicVideos, isLoading: loadingRecommended } = usePublicVideos();

  // Filter out the currently playing video from the recommendations
  const recommendedVideos = React.useMemo(() => {
    if (!publicVideos) return [];
    return publicVideos.filter((v) => v.id !== videoId && v.thumbKey !== null);
  }, [publicVideos, videoId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-white border border-border rounded-2xl shadow-sm max-w-md mx-auto mt-12 gap-4">
        <div className="text-primary font-bold text-lg">Failed to load video</div>
        <p className="text-sm text-text-secondary">
          The video may have been deleted, or the playback signature could not be verified by the backend.
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <RefreshCw size={14} />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left side: Large Video Player and Info */}
      <div className="lg:col-span-8 space-y-4">
        <VideoPlayer
          playUrl={playbackResponse?.playUrl || null}
          selectedQuality={selectedQuality}
          availableQualities={availableQualities}
          onQualityChange={changeQuality}
          loading={loading}
          poster={playbackResponse?.thumbUrl || null}
        />

        {/* Video metadata */}
        <div className="space-y-3 bg-white p-5 rounded-2xl border border-border shadow-sm">
          <h1 className="text-xl font-bold text-text-primary leading-snug">
            {playbackResponse?.title || "Loading video details..."}
          </h1>

          {/* User profile row */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary text-white font-bold rounded-full flex items-center justify-center shadow-sm uppercase">
                {playbackResponse?.title ? playbackResponse.title[0] : "V"}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  ViewTube Creator
                </p>
                <p className="text-[10px] text-text-secondary">
                  Ultra low latency node
                </p>
              </div>
            </div>
          </div>

          {/* Video Description Box */}
          <div className="bg-background-secondary p-4 rounded-xl space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-text-secondary">
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                <span>Streaming in {selectedQuality}</span>
              </span>
              <span>•</span>
              <span>Signed playback key active</span>
            </div>
            <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
              This video was successfully uploaded and transcoded into adaptive-bitrate qualities (480p, 720p, and 1080p).
              Use the gear icon on the video player overlay to seamlessly switch qualities without losing your playback position.
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Recommended videos sidebar */}
      <div className="lg:col-span-4 space-y-4">
        <h2 className="text-sm font-bold text-text-primary tracking-wider uppercase pl-1">
          Recommended Videos
        </h2>

        {loadingRecommended ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex gap-3 animate-pulse">
                <div className="h-20 w-32 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 bg-gray-200 rounded w-11/12" />
                  <div className="h-2.5 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recommendedVideos.length === 0 ? (
          <p className="text-xs text-text-secondary italic pl-1">
            No other recommended public videos available at this time.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {recommendedVideos.map((video) => (
              <RecommendedVideoRow key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for a sleek horizontal recommended video card
function RecommendedVideoRow({ video }: { video: Video }) {
  const { playbackResponse: thumbUrl } = useVideoPlayback(video.id);

  return (
    <Link href={`/watch/${video.id}`} className="group flex gap-3 cursor-pointer">
      <div className="relative h-20 w-32 overflow-hidden rounded-lg bg-gray-200 border border-border flex-shrink-0 transition-transform group-hover:scale-[1.03]">
        {video.thumbKey && thumbUrl?.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl.thumbUrl}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-400">
            <PlayCircle size={20} className="opacity-50" />
          </div>
        )}
      </div>

      <div className="flex flex-col min-w-0 py-0.5 justify-between">
        <div>
          <h4 className="text-xs font-semibold text-text-primary leading-snug line-clamp-2 group-hover:text-primary transition-colors pr-2">
            {video.title}
          </h4>
          <p className="text-[10px] text-text-secondary mt-1 truncate font-medium">
            ViewTube Creator
          </p>
        </div>
        <p className="text-[10px] text-text-secondary">
          {formatTimeAgo(video.createdAt)}
        </p>
      </div>
    </Link>
  );
}
