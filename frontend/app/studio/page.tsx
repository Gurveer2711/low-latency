"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useMyVideos, useDeleteVideo, useUpdateVideo, useVideoPlayback } from "@/hooks/useVideos";
import { formatTimeAgo } from "@/lib/utils";
import { Video } from "@/types";
import { Edit2, Trash2, Check, X, UploadCloud, Film, Eye, EyeOff, Loader2, Play } from "lucide-react";
import toast from "react-hot-toast";
import VideoPlayer from "@/components/VideoPlayer";

export default function StudioPage() {
  const { data: videos, isLoading, refetch } = useMyVideos();
  const deleteMutation = useDeleteVideo();
  const updateMutation = useUpdateVideo();

  // State for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editVisibility, setEditVisibility] = useState<"public" | "private">("public");

  // State for delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // State for video preview modal
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);

  // Poll video list if there are any pending or processing videos
  const hasProcessing = React.useMemo(() => {
    return videos?.some((v) => v.status === "pending" || v.status === "processing") ?? false;
  }, [videos]);

  useEffect(() => {
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(interval);
  }, [hasProcessing, refetch]);

  const handleStartEdit = (video: Video) => {
    setEditingId(video.id);
    setEditTitle(video.title);
    setEditDesc(video.description || "");
    setEditVisibility(video.visibility);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        title: editTitle.trim(),
        description: editDesc.trim(),
        visibility: editVisibility,
      });
      toast.success("Video updated successfully!");
      setEditingId(null);
    } catch {
      toast.error("Failed to update video.");
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteMutation.mutateAsync(confirmDeleteId);
      toast.success("Video deleted successfully.");
      setConfirmDeleteId(null);
    } catch {
      toast.error("Failed to delete video.");
    }
  };

  // Status helper mapping
  const getStatusPill = (status: Video["status"]) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Pending</span>;
      case "processing":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 flex items-center gap-1 w-fit">
            <Loader2 size={12} className="animate-spin" />
            <span>Processing</span>
          </span>
        );
      case "processed":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">Processed</span>;
      case "failed":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Film size={22} className="text-primary" />
            <span>Channel content</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Manage your uploads, monitor transcode states, and publish your videos.
          </p>
        </div>
        <Link
          href="/studio/upload"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm self-start sm:self-center"
        >
          <UploadCloud size={16} />
          <span>Upload Video</span>
        </Link>
      </div>

      {/* Videos List Table */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">
              Retrieving uploads...
            </p>
          </div>
        ) : !videos || videos.length === 0 ? (
          <div className="p-20 text-center max-w-sm mx-auto flex flex-col items-center gap-4">
            <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center text-text-secondary">
              <Film size={26} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-text-primary">No uploads yet</h3>
              <p className="text-xs text-text-secondary mt-1">
                Upload your first video to start building your channel list!
              </p>
            </div>
            <Link
              href="/studio/upload"
              className="px-4 py-2 border border-border hover:bg-cardHover rounded-lg text-xs font-semibold text-text-primary transition-colors"
            >
              Upload Video
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background-secondary text-text-secondary text-xs uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-6 font-semibold w-[200px]">Video</th>
                  <th className="py-3.5 px-4 font-semibold w-[240px]">Details</th>
                  <th className="py-3.5 px-4 font-semibold">Visibility</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Uploaded</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {videos.map((video) => {
                  const isEditing = editingId === video.id;

                  return (
                    <tr key={video.id} className="hover:bg-background-secondary/40 transition-colors">
                      {/* Thumbnail Column */}
                      <td className="py-4 px-6 align-top">
                        <div
                          className={`aspect-video w-[140px] rounded-lg bg-gray-900 border border-border overflow-hidden flex items-center justify-center text-gray-500 relative ${
                            video.status === "processed" ? "cursor-pointer group/thumb" : ""
                          }`}
                          onClick={() => {
                            if (video.status === "processed") {
                              setPreviewVideo(video);
                            }
                          }}
                        >
                          {video.thumbKey ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`http://localhost:3000/videos/${video.id}/play?format=480p`}
                              alt={video.title}
                              className="h-full w-full object-cover opacity-60 transition-opacity group-hover/thumb:opacity-40" // Direct call will redirect to presigned
                              onError={(e) => {
                                // hide broken img
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Film size={18} className="opacity-40" />
                          )}
                          
                          {/* Play button overlay on hover (only when processed) */}
                          {video.status === "processed" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200">
                              <div className="p-2 bg-primary hover:bg-red-600 rounded-full text-white shadow-md transform scale-90 group-hover/thumb:scale-100 transition-all duration-200">
                                <Play size={16} fill="currentColor" className="ml-0.5" />
                              </div>
                            </div>
                          )}

                          {video.variants && (
                            <span className="absolute bottom-1 right-1 px-1 bg-black/80 text-[8px] font-bold text-white rounded">
                              {Object.keys(video.variants).filter(k => k.endsWith('p')).join(', ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Details Column */}
                      <td className="py-4 px-4 align-top max-w-[240px]">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Title"
                              className="w-full px-2 py-1 text-xs border border-border rounded focus:outline-none focus:border-primary text-text-primary"
                            />
                            <textarea
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              placeholder="Description"
                              rows={2}
                              className="w-full px-2 py-1 text-xs border border-border rounded focus:outline-none focus:border-primary text-text-primary resize-none"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <h3 className="font-semibold text-text-primary leading-snug line-clamp-1">
                              {video.title}
                            </h3>
                            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                              {video.description || <span className="italic opacity-60">No description</span>}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Visibility Column */}
                      <td className="py-4 px-4 align-top">
                        {isEditing ? (
                          <select
                            value={editVisibility}
                            onChange={(e) => setEditVisibility(e.target.value as "public" | "private")}
                            className="px-2 py-1 text-xs border border-border rounded focus:outline-none focus:border-primary text-text-primary bg-white"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                          </select>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                            {video.visibility === "public" ? (
                              <>
                                <Eye size={14} className="text-green-600" />
                                <span>Public</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={14} className="text-gray-400" />
                                <span>Private</span>
                              </>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-4 align-top">
                        {getStatusPill(video.status)}
                      </td>

                      {/* Uploaded Column */}
                      <td className="py-4 px-4 align-top text-xs text-text-secondary font-medium">
                        {formatTimeAgo(video.createdAt)}
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-6 align-top text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(video.id)}
                              disabled={updateMutation.isPending}
                              className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                              title="Save Changes"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            {video.status === "processed" && (
                              <button
                                onClick={() => setPreviewVideo(video)}
                                className="p-1.5 hover:bg-gray-100 hover:text-primary text-text-secondary rounded-lg transition-colors border border-transparent hover:border-border"
                                title="Preview Video"
                              >
                                <Play size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleStartEdit(video)}
                              className="p-1.5 hover:bg-gray-100 hover:text-text-primary text-text-secondary rounded-lg transition-colors border border-transparent hover:border-border"
                              title="Edit Details"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(video.id)}
                              className="p-1.5 hover:bg-red-50 hover:text-primary text-text-secondary rounded-lg transition-colors border border-transparent hover:border-red-100"
                              title="Delete Video"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-border space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <h3 className="text-base font-bold text-text-primary">Delete Video Permanentally?</h3>
              <p className="text-xs text-text-secondary mt-1.5">
                This action cannot be undone. The video database record and all transcode files stored in S3 will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 border border-border hover:bg-cardHover rounded-lg text-xs font-semibold text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-primary hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:bg-red-300"
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal Overlay */}
      {previewVideo && (
        <VideoPreviewModal
          video={previewVideo}
          onClose={() => setPreviewVideo(null)}
        />
      )}
    </div>
  );
}

// Sub-component to manage full video loading, switching, and settings controls in the Studio dashboard
function VideoPreviewModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const {
    playbackResponse,
    availableQualities,
    selectedQuality,
    changeQuality,
    loading,
    error,
    refetch,
  } = useVideoPlayback(video.id);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-2xl p-6 shadow-2xl border border-border flex flex-col gap-4 animate-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full text-text-secondary hover:text-text-primary transition-colors z-10"
          title="Close Preview"
        >
          <X size={18} />
        </button>

        <div className="pr-8">
          <h3 className="text-base font-bold text-text-primary truncate">
            {video.title}
          </h3>
          <p className="text-[10px] text-text-secondary mt-0.5">
            Streaming format resolution: <span className="font-semibold text-primary">{selectedQuality}</span>
          </p>
        </div>

        {error ? (
          <div className="aspect-video w-full rounded-2xl bg-gray-950 flex flex-col items-center justify-center text-center p-6 gap-3">
            <div className="text-primary font-semibold text-sm">Failed to load video</div>
            <p className="text-xs text-gray-400 max-w-sm">
              The playback signature could not be verified by the backend or the video has been deleted.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 bg-primary hover:bg-red-600 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <VideoPlayer
            playUrl={playbackResponse?.playUrl || null}
            selectedQuality={selectedQuality}
            availableQualities={availableQualities}
            onQualityChange={changeQuality}
            loading={loading}
            poster={playbackResponse?.thumbUrl || null}
          />
        )}

        {video.description && (
          <div className="max-h-24 overflow-y-auto bg-background-secondary p-3 rounded-xl border border-border">
            <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Description</h4>
            <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
              {video.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
