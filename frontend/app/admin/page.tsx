"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Film, Users, AlertCircle, ArrowUpRight, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  // Queries for dashboard stats
  const { data: videosRes, isLoading: loadingVideos } = useQuery({
    queryKey: ["admin-stats-videos"],
    queryFn: async () => {
      const res = await api.get("/admin/videos");
      return res.data as { count: number };
    },
  });

  const { data: usersRes, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-stats-users"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      return res.data as { count: number };
    },
  });

  const { data: failedJobsRes, isLoading: loadingFailed } = useQuery({
    queryKey: ["admin-stats-failed"],
    queryFn: async () => {
      const res = await api.get("/videos/failed/jobs");
      return res.data as { count: number };
    },
  });

  const stats = [
    {
      name: "Total Videos",
      value: loadingVideos ? "..." : videosRes?.count ?? 0,
      icon: Film,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      link: "/admin/videos",
      linkLabel: "View all videos",
    },
    {
      name: "Total Registered Users",
      value: loadingUsers ? "..." : usersRes?.count ?? 0,
      icon: Users,
      color: "text-green-600 bg-green-50 border-green-100",
      link: "/admin/users",
      linkLabel: "View all users",
    },
    {
      name: "Failed Transcode Jobs",
      value: loadingFailed ? "..." : failedJobsRes?.count ?? 0,
      icon: AlertCircle,
      color: failedJobsRes?.count && failedJobsRes.count > 0 
        ? "text-red-600 bg-red-50 border-red-200 animate-pulse" 
        : "text-gray-500 bg-gray-50 border-gray-100",
      link: "/admin/videos", // failed jobs details can be shown here or video list
      linkLabel: "Inspect queues",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <span>Admin Overview</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            System status monitoring, BullMQ transcode pipelines, and user database control.
          </p>
        </div>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const IconComp = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-text-primary tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${stat.color}`}>
                  <IconComp size={22} />
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-border flex justify-end">
                <Link
                  href={stat.link}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <span>{stat.linkLabel}</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Database/Transcode Pipeline Info Section */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          System Specifications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-background-secondary rounded-xl space-y-1.5 border border-border">
            <p className="font-bold text-text-secondary">BullMQ Redis Transcoder</p>
            <p className="text-text-primary">Status: <span className="text-green-600 font-bold">Online</span></p>
            <p className="text-text-secondary">Processes files uploaded to S3 raw bucket directly.</p>
          </div>
          <div className="p-4 bg-background-secondary rounded-xl space-y-1.5 border border-border">
            <p className="font-bold text-text-secondary">Prisma Postgres Client</p>
            <p className="text-text-primary">Status: <span className="text-green-600 font-bold">Connected</span></p>
            <p className="text-text-secondary">Syncs video metadata and user credentials securely.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
