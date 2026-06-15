"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Video, FailedJob } from "@/types";
import { formatTimeAgo } from "@/lib/utils";
import { Trash2, Film, ShieldAlert, Loader2, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminVideosPage() {
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch all videos (Admin endpoint)
  const { data: videosRes, isLoading: loadingVideos, refetch: refetchVideos } = useQuery({
    queryKey: ["admin-manage-videos"],
    queryFn: async () => {
      const res = await api.get("/admin/videos");
      return res.data.videos as Video[];
    },
  });

  // Fetch all failed transcode jobs from queue (Admin/Video endpoint)
  const { data: failedRes, isLoading: loadingFailed, refetch: refetchFailed } = useQuery({
    queryKey: ["admin-manage-failed-jobs"],
    queryFn: async () => {
      const res = await api.get("/videos/failed/jobs");
      return res.data.jobs as FailedJob[];
    },
  });

  // Admin Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/videos/${id}`);
    },
    onSuccess: () => {
      toast.success("Video permanently deleted by administrator.");
      queryClient.invalidateQueries({ queryKey: ["admin-manage-videos"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats-videos"] });
      setConfirmDeleteId(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete video.");
    },
  });

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      deleteMutation.mutate(confirmDeleteId);
    }
  };

  const getStatusColor = (status: Video["status"]) => {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-700";
      case "processing": return "bg-blue-50 text-blue-700";
      case "processed": return "bg-green-50 text-green-700";
      case "failed": return "bg-red-50 text-red-700";
      default: return "";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
        <Link
          href="/admin"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Film size={20} className="text-primary" />
            <span>Video Content Manager</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Global catalog oversight. Review public/private settings, transcoding status, and purge failed uploads.
          </p>
        </div>
      </div>

      {/* Main Videos List */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            All Uploaded Videos ({videosRes?.length ?? 0})
          </h2>
          <button
            onClick={() => refetchVideos()}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-all"
            title="Reload Video List"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {loadingVideos ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">
              Retrieving video database logs...
            </p>
          </div>
        ) : !videosRes || videosRes.length === 0 ? (
          <div className="p-20 text-center text-xs text-text-secondary italic">
            No video records currently exist in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background-secondary text-text-secondary text-xs uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-6 font-semibold w-[120px]">Thumbnail</th>
                  <th className="py-3.5 px-4 font-semibold">Video ID / Title</th>
                  <th className="py-3.5 px-4 font-semibold">Visibility</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Uploaded</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Purge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {videosRes.map((video) => (
                  <tr key={video.id} className="hover:bg-background-secondary/40 transition-colors">
                    {/* Thumbnail */}
                    <td className="py-4 px-6 align-top">
                      <div className="aspect-video w-[100px] rounded-lg bg-gray-900 overflow-hidden flex items-center justify-center text-gray-500 border border-border">
                        {video.thumbKey ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`http://localhost:3000/videos/${video.id}/play?format=480p`}
                            alt={video.title}
                            className="h-full w-full object-cover opacity-60"
                            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                          />
                        ) : (
                          <Film size={14} className="opacity-30" />
                        )}
                      </div>
                    </td>

                    {/* ID / Title / Owner */}
                    <td className="py-4 px-4 align-top max-w-[200px] space-y-1">
                      <h3 className="font-semibold text-text-primary truncate">{video.title}</h3>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{video.id}</p>
                      <p className="text-[10px] text-text-secondary font-medium">Owner ID: {video.userId || "system-orphaned"}</p>
                    </td>

                    {/* Visibility */}
                    <td className="py-4 px-4 align-top font-medium uppercase text-[10px] text-text-secondary">
                      {video.visibility}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 align-top">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(video.status)}`}>
                        {video.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 align-top text-text-secondary font-medium">
                      {formatTimeAgo(video.createdAt)}
                    </td>

                    {/* Delete Action */}
                    <td className="py-4 px-6 align-top text-right">
                      <button
                        onClick={() => setConfirmDeleteId(video.id)}
                        className="p-1.5 bg-red-50 text-primary border border-red-100 hover:bg-primary hover:text-white rounded-lg transition-all"
                        title="Force Delete Video"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Failed Jobs Logs */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-red-50/20">
          <h2 className="text-xs font-bold text-red-800 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle size={15} />
            <span>Failed Transcode Jobs Queue ({failedRes?.length ?? 0})</span>
          </h2>
          <button
            onClick={() => refetchFailed()}
            className="p-1.5 text-red-800 hover:bg-red-100/40 rounded-lg transition-all"
            title="Reload Queue"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {loadingFailed ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : !failedRes || failedRes.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-secondary italic bg-gray-50/50">
            No failed jobs found in the BullMQ Redis queue. The transcode pipeline is functioning perfectly.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-red-50/5 text-red-800 text-[10px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-6 font-semibold w-[100px]">Job ID</th>
                  <th className="py-3.5 px-4 font-semibold w-[160px]">Video ID</th>
                  <th className="py-3.5 px-4 font-semibold">Error Reason</th>
                  <th className="py-3.5 px-4 font-semibold w-[100px]">Retries</th>
                  <th className="py-3.5 px-6 font-semibold w-[160px]">Failed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[11px] font-medium text-text-primary">
                {failedRes.map((job, idx) => (
                  <tr key={idx} className="hover:bg-red-50/10">
                    <td className="py-3 px-6 font-mono text-gray-500">{job.jobId ?? "N/A"}</td>
                    <td className="py-3 px-4 font-mono text-gray-400 truncate max-w-[140px]">{job.videoId}</td>
                    <td className="py-3 px-4 text-red-700 font-normal leading-relaxed">{job.failedReason}</td>
                    <td className="py-3 px-4 text-text-secondary">{job.attemptsMade} / 3</td>
                    <td className="py-3 px-6 text-text-secondary">{job.failedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Purge Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-border space-y-4">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 bg-red-50 text-primary border border-red-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert size={22} />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Purge this Video Permanentally?</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                As an <span className="font-bold text-primary">Administrator</span>, you are overriding creator boundaries. This purges database rows and removes original and multi-quality mp4 transcodes from S3.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 border border-border hover:bg-cardHover rounded-lg text-xs font-semibold text-text-primary transition-all"
              >
                Keep Video
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-primary hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all shadow-sm disabled:bg-red-300"
              >
                {deleteMutation.isPending ? "Purging..." : "Confirm Purge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
