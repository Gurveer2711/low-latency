"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUpload } from "@/hooks/useUpload";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileVideo, AlertCircle, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const uploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
});

type UploadValues = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const { user } = useAuth();
  const { uploadVideo, progress, isUploading } = useUpload();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<UploadValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file (MP4 preferred)");
      return;
    }
    
    setSelectedFile(file);
    
    // Auto-populate title from file name (without extension)
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setValue("title", baseName.substring(0, 100));
  };

  const removeFile = () => {
    if (isUploading) return;
    setSelectedFile(null);
    reset({
      title: "",
      description: "",
    });
  };

  const onSubmit = async (values: UploadValues) => {
    if (!selectedFile) {
      toast.error("Please select a video file to upload");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to upload");
      return;
    }

    try {
      // Pass the selected file and Form details
      // Wait, we need to pass userId to associate the video owner!
      // In useUpload, we will pass selectedFile, title, description, and userId.
      // Wait, our hook signature is `uploadVideo(file, title, description)`.
      // Let's modify useUpload call to pass the parameters.
      // Wait! We can modify the hook or pass it inside the hook. Let's see:
      // In useUpload, we can grab the user from useAuth hook directly, or pass userId.
      // Ah! In useUpload, we did:
      // `const requestResponse = await api.post("/upload/request", { title: file.name, contentType: file.type })`
      // `await api.post("/webhook/s3-upload", { videoId, rawKey, title, userId: user?.id })`
      // Wait! Does useUpload have access to user? Yes, inside useUpload we can import useAuth or just pass it in.
      // Let's look at what we wrote in useUpload.ts:
      // `await api.post("/webhook/s3-upload", { videoId, rawKey, title })` -> Oh! It doesn't pass userId!
      // Wait! Let's modify the useUpload hook or call it differently. Let's check:
      // Can we update useUpload hook to take `userId` or import useAuth?
      // Yes! Let's modify `hooks/useUpload.ts` to accept `userId` or get it from auth!
      // Actually, passing `userId` as the 4th parameter of `uploadVideo(file, title, description, userId)` is extremely clean!
      // Let's check if we did that or if we need to modify it. We didn't do it yet in `hooks/useUpload.ts`. Let's update `hooks/useUpload.ts` to support this!
      // Wait, let's write `upload/page.tsx` first, assuming we will pass `user.id` to `uploadVideo`. Then we will update `useUpload.ts`!

      await uploadVideo(selectedFile, values.title, values.description || "", user.id);
      toast.success("Upload successful! Video added to queue.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Failed to upload video.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
        <Link href="/studio" className="hover:text-primary transition-colors">Studio</Link>
        <ChevronRight size={12} />
        <span className="text-text-primary font-semibold">Upload Content</span>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Upload Video Details</h1>
          <p className="text-xs text-text-secondary mt-1">
            Choose an MP4 file. The video will be transcoded into multiple qualities automatically.
          </p>
        </div>

        {isUploading ? (
          /* Uploading Progress Screen */
          <div className="py-10 flex flex-col items-center justify-center gap-6">
            <div className="relative h-20 w-20 flex items-center justify-center bg-red-50 text-primary rounded-full shadow-inner">
              <Upload className="animate-bounce" size={32} />
            </div>
            
            <div className="w-full space-y-2 text-center max-w-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                <span>Direct S3 Upload Progress</span>
                <span className="text-primary font-bold">{progress}%</span>
              </div>
              {/* Progress bar container */}
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-xs flex gap-2 border border-amber-100 max-w-md">
              <AlertCircle size={16} className="flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Important Notice:</span> Do not close this browser tab or navigate away.
                Uploading raw video binary chunks directly to the private S3 bucket.
              </div>
            </div>
          </div>
        ) : (
          /* Upload Settings Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Drag & Drop Area */}
            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed ${
                  dragActive ? "border-primary bg-red-50/10" : "border-border hover:border-gray-400"
                } rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 bg-background-secondary/30`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  className="hidden"
                />
                <div className="h-12 w-12 bg-red-50 text-primary rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Upload size={22} />
                </div>
                <h3 className="font-semibold text-sm text-text-primary">Drag and drop video files</h3>
                <p className="text-xs text-text-secondary mt-1 max-w-xs">
                  Your files will be private until you publish them. MP4 format is highly recommended.
                </p>
                <button
                  type="button"
                  className="mt-5 px-4 py-2 bg-primary hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  Select File
                </button>
              </div>
            ) : (
              /* File Selection Summary Card */
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-border rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 bg-red-100 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileVideo size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate max-w-[280px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors text-text-secondary"
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Title & Description Form inputs */}
            {selectedFile && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                    Video Title
                  </label>
                  <input
                    type="text"
                    placeholder="Provide a catchy title"
                    {...register("title")}
                    className={`w-full px-3 py-2 text-sm border ${
                      errors.title ? "border-red-500" : "border-border"
                    } rounded-lg bg-background-secondary text-text-primary focus:outline-none focus:border-primary transition-colors`}
                  />
                  {errors.title && (
                    <span className="text-xs text-red-500 mt-1 block font-semibold">
                      {errors.title.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Tell viewers about your video..."
                    rows={4}
                    {...register("description")}
                    className={`w-full px-3 py-2 text-sm border ${
                      errors.description ? "border-red-500" : "border-border"
                    } rounded-lg bg-background-secondary text-text-primary focus:outline-none focus:border-primary transition-colors resize-none`}
                  />
                  {errors.description && (
                    <span className="text-xs text-red-500 mt-1 block font-semibold">
                      {errors.description.message}
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={removeFile}
                    className="px-4 py-2 border border-border hover:bg-cardHover rounded-lg text-xs font-semibold text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    Start Upload
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
