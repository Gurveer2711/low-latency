"use client";

import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../../../hooks/useAuth";
import { Play } from "lucide-react";
import toast from "react-hot-toast";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const { login, isLoggingIn } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInValues) => {
    try {
      await login(values);
      toast.success("Successfully logged in!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary p-4">
      <div className="w-full max-w-md bg-white border border-border rounded-2xl p-8 shadow-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary text-white p-2 rounded-xl mb-2">
            <Play size={20} fill="white" className="ml-0.5" />
          </div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Sign in to View<span className="text-primary">Tube</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Mentoring our future FAANG engineers
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className={`w-full px-3 py-2 text-sm border ${
                errors.email ? "border-red-500" : "border-border"
              } rounded-lg bg-background-secondary text-text-primary focus:outline-none focus:border-primary transition-colors`}
            />
            {errors.email && (
              <span className="text-xs text-red-500 mt-1 block font-medium">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className={`w-full px-3 py-2 text-sm border ${
                errors.password ? "border-red-500" : "border-border"
              } rounded-lg bg-background-secondary text-text-primary focus:outline-none focus:border-primary transition-colors`}
            />
            {errors.password && (
              <span className="text-xs text-red-500 mt-1 block font-medium">
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-2 bg-primary hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:bg-red-300 mt-6 shadow-sm flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <span className="inline-block border-2 border-white border-t-transparent animate-spin rounded-full h-4 w-4" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Link */}
        <div className="text-center mt-6 pt-6 border-t border-border">
          <p className="text-xs text-text-secondary">
            New to ViewTube?{" "}
            <Link href="/sign-up" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
