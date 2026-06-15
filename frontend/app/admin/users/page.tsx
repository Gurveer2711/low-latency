"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { User } from "@/types";
import { formatTimeAgo } from "@/lib/utils";
import { Trash2, Users, ShieldAlert, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch all users (Admin endpoint)
  const { data: usersRes, isLoading: loadingUsers, refetch } = useQuery({
    queryKey: ["admin-manage-users"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      return res.data.users as User[];
    },
  });

  // Admin Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      toast.success("User and all associated uploads successfully purged.");
      queryClient.invalidateQueries({ queryKey: ["admin-manage-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats-users"] });
      setConfirmDeleteId(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete user.");
    },
  });

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      deleteMutation.mutate(confirmDeleteId);
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
            <Users size={20} className="text-primary" />
            <span>User Account Manager</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Platform membership database. Monitor user signups, evaluate role scopes, and terminate violating accounts.
          </p>
        </div>
      </div>

      {/* Main Users List */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            All Registered Accounts ({usersRes?.length ?? 0})
          </h2>
          <button
            onClick={() => refetch()}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-all"
            title="Reload User List"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {loadingUsers ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">
              Retrieving membership logs...
            </p>
          </div>
        ) : !usersRes || usersRes.length === 0 ? (
          <div className="p-20 text-center text-xs text-text-secondary italic">
            No registered users exist in the database logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background-secondary text-text-secondary text-xs uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-6 font-semibold">User Details</th>
                  <th className="py-3.5 px-4 font-semibold">Unique User ID</th>
                  <th className="py-3.5 px-4 font-semibold">Role Scope</th>
                  <th className="py-3.5 px-4 font-semibold">Created Date</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Delete Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {usersRes.map((userObj) => (
                  <tr key={userObj.id} className="hover:bg-background-secondary/40 transition-colors">
                    {/* User Avatar & Email */}
                    <td className="py-4 px-6 align-middle flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-red-100 text-primary flex items-center justify-center font-bold uppercase shadow-sm">
                        {userObj.email[0]}
                      </div>
                      <span className="font-semibold text-text-primary">{userObj.email}</span>
                    </td>

                    {/* User ID */}
                    <td className="py-4 px-4 align-middle font-mono text-gray-400">
                      {userObj.id}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4 align-middle">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        userObj.role === "admin" 
                          ? "bg-red-50 text-primary border border-red-100" 
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {userObj.role}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 align-middle text-text-secondary font-medium">
                      {formatTimeAgo(userObj.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 align-middle text-right">
                      {userObj.role === "admin" ? (
                        <span className="text-[10px] text-gray-400 font-semibold px-2 py-1 select-none">Protected</span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(userObj.id)}
                          className="p-1.5 bg-red-50 text-primary border border-red-100 hover:bg-primary hover:text-white rounded-lg transition-all"
                          title="Purge User Account"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Deletion Warning Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-border space-y-4">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 bg-red-50 text-primary border border-red-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert size={22} />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Purge User Membership?</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Deleting this account will trigger a cascade purge: the user credentials, all associated video metadata, and <span className="font-bold text-primary">all original and transcoded video files in S3</span> will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 border border-border hover:bg-cardHover rounded-lg text-xs font-semibold text-text-primary transition-all"
              >
                Cancel
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
