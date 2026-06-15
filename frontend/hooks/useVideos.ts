import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Video, VideoQuality, PlaybackResponse } from "../types";

// Fetch public videos
export function usePublicVideos() {
  return useQuery({
    queryKey: ["public-videos"],
    queryFn: async () => {
      const response = await api.get("/videos");
      return response.data.videos as Video[];
    },
  });
}

// Fetch user's own videos
export function useMyVideos() {
  return useQuery({
    queryKey: ["my-videos"],
    queryFn: async () => {
      const response = await api.get("/videos/mine");
      return response.data.videos as Video[];
    },
  });
}

// Poll video status (e.g. in Studio)
export function useVideoStatus(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["video-status", id],
    queryFn: async () => {
      const response = await api.get(`/videos/${id}/status`);
      return response.data as {
        id: string;
        title: string;
        status: "pending" | "processing" | "processed" | "failed";
        variants: any;
        createdAt: string;
      };
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === "processed" || data.status === "failed")) {
        return false; // stop polling
      }
      return 3000; // poll every 3 seconds
    },
    enabled: !!id && enabled,
  });
}

// Delete video mutation
export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-videos"] });
      queryClient.invalidateQueries({ queryKey: ["public-videos"] });
    },
  });
}

// Update video details mutation
export function useUpdateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, description, visibility }: { id: string; title: string; description: string; visibility: "public" | "private" }) => {
      const response = await api.patch(`/videos/${id}`, { title, description, visibility });
      return response.data.video;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-videos"] });
      queryClient.invalidateQueries({ queryKey: ["public-videos"] });
    },
  });
}

// Video Playback Hook
export function useVideoPlayback(id: string) {
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>("480p");
  const [hasSelectedHighest, setHasSelectedHighest] = useState(false);

  // We query with the selected quality format
  const {
    data: playbackResponse,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<PlaybackResponse>({
    queryKey: ["video-playback", id, selectedQuality],
    queryFn: async () => {
      const response = await api.get(`/videos/${id}/play?format=${selectedQuality}`);
      return response.data as PlaybackResponse;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // cache play urls for 5 mins
  });

  // Auto-select highest quality on initial load
  useEffect(() => {
    if (playbackResponse && !hasSelectedHighest) {
      const available = playbackResponse.availableFormats || [];
      if (available.length > 0) {
        // Find highest quality out of 1080p, 720p, 480p
        let highest: VideoQuality = "480p";
        if (available.includes("1080p")) {
          highest = "1080p";
        } else if (available.includes("720p")) {
          highest = "720p";
        }
        if (highest !== selectedQuality) {
          setSelectedQuality(highest);
        }
        setHasSelectedHighest(true);
      }
    }
  }, [playbackResponse, hasSelectedHighest, selectedQuality]);

  const changeQuality = (quality: VideoQuality) => {
    setSelectedQuality(quality);
  };

  const availableQualities = playbackResponse?.availableFormats || ["480p"];

  return {
    playbackResponse: playbackResponse || null,
    availableQualities,
    selectedQuality,
    changeQuality,
    loading,
    error,
    refetch,
  };
}
