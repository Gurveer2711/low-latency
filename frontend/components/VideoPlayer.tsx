"use client";

import React, { useRef, useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { VideoQuality } from "../types";
import QualitySelector from "./QualitySelector";
import { Loader2, AlertCircle, Maximize, Minimize } from "lucide-react";
import toast from "react-hot-toast";

interface VideoPlayerProps {
  playUrl: string | null;
  selectedQuality: VideoQuality;
  availableQualities: VideoQuality[];
  onQualityChange: (quality: VideoQuality) => void;
  loading: boolean;
  poster: string | null;
}

export default function VideoPlayer({
  playUrl,
  selectedQuality,
  availableQualities,
  onQualityChange,
  loading,
  poster,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isSwitching, setIsSwitching] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const savedTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);

  const prevUrlRef = useRef<string | null>(null);

  // Track quality switch to preserve playback position and play state
  useEffect(() => {
    if (playUrl && prevUrlRef.current && prevUrlRef.current !== playUrl) {
      if (videoRef.current) {
        // Save current timestamp and play status
        savedTimeRef.current = videoRef.current.currentTime;
        wasPlayingRef.current = !videoRef.current.paused;
        setIsSwitching(true);
        setHasError(false);
        logger.info(`VideoPlayer: Switching to ${selectedQuality}. Stashing time: ${savedTimeRef.current}s, wasPlaying: ${wasPlayingRef.current}`);
      }
    }
    prevUrlRef.current = playUrl;
  }, [playUrl, selectedQuality]);

  // Handle when video is loaded and ready to play at the new URL
  const handleCanPlay = () => {
    if (isSwitching && videoRef.current) {
      logger.info(`VideoPlayer: Stream loaded for ${selectedQuality}. Restoring position: ${savedTimeRef.current}s, play: ${wasPlayingRef.current}`);
      // Restore timestamp
      videoRef.current.currentTime = savedTimeRef.current;
      
      // Restore playing state
      if (wasPlayingRef.current) {
        videoRef.current.play().catch((err) => {
          logger.warn("VideoPlayer: Autoplay restoration failed or blocked by browser policy.", err);
        });
      }
      setIsSwitching(false);
    }
  };

  const handleVideoError = () => {
    logger.error(`VideoPlayer: Failed to load source URL for quality ${selectedQuality}.`, { playUrl });
    setHasError(true);
    setIsSwitching(false);
    toast.error("Failed to load video format. S3 link may have expired.");
  };

  // Custom Fullscreen toggle on container to keep controls visible
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        toast.error("Fullscreen request failed");
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Sync fullscreen change events (e.g. if user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const isSpinnerShowing = loading || isSwitching;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border shadow-md group"
    >
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center gap-3">
          <AlertCircle size={40} className="text-primary" />
          <div>
            <h3 className="font-semibold text-base">Playback Error</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              The selected resolution could not be loaded. This might occur if the signed playback URL expired or transcode files were modified. Try reloading or switching qualities.
            </p>
          </div>
          <button
            onClick={() => {
              setHasError(false);
              videoRef.current?.load();
            }}
            className="px-4 py-1.5 bg-primary hover:bg-red-600 rounded-lg text-xs font-semibold transition-colors"
          >
            Retry Playback
          </button>
        </div>
      ) : playUrl ? (
        <>
          <video
            ref={videoRef}
            src={playUrl}
            poster={poster || undefined}
            onCanPlay={handleCanPlay}
            onError={handleVideoError}
            controls
            className="w-full h-full object-contain"
            playsInline
          />

          {/* Loader Overlay (with smooth backdrop blur) */}
          {isSpinnerShowing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all duration-300 z-10 pointer-events-none">
              <div className="bg-black/75 p-4 rounded-2xl flex flex-col items-center gap-2 text-white shadow">
                <Loader2 size={32} className="animate-spin text-primary" />
                <span className="text-xs font-medium">
                  {loading ? "Requesting URL..." : `Switching to ${selectedQuality}...`}
                </span>
              </div>
            </div>
          )}

          {/* Quality Selector Control Overlay (renders in top-right on hover) */}
          <div className="absolute top-4 right-4 z-20 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex items-center gap-2">
            <QualitySelector
              currentQuality={selectedQuality}
              availableQualities={availableQualities}
              onQualityChange={onQualityChange}
            />

            {/* Custom fullscreen overlay button to ensure container-fullscreen is easy */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg text-xs font-semibold backdrop-blur-sm transition-colors border border-white/10"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-950">
          <Loader2 size={36} className="animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
