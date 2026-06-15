"use client";

import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../../../hooks/useAuth";
import { Play } from "lucide-react";
import toast from "react-hot-toast";

const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must match"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const { register: registerUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignUpValues) => {
    try {
      await registerUser({
        email: values.email,
        password: values.password,
      });
      toast.success("Successfully registered account!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed. Email may already be in use.");
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
            Create a View<span className="text-primary">Tube</span> Account
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Build your skills, stream your projects
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              className={`w-full px-3 py-2 text-sm border ${
                errors.confirmPassword ? "border-red-500" : "border-border"
              } rounded-lg bg-background-secondary text-text-primary focus:outline-none focus:border-primary transition-colors`}
            />
            {errors.confirmPassword && (
              <span className="text-xs text-red-500 mt-1 block font-medium">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full py-2 bg-primary hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:bg-red-300 mt-6 shadow-sm flex items-center justify-center gap-2"
          >
            {isRegistering ? (
              <span className="inline-block border-2 border-white border-t-transparent animate-spin rounded-full h-4 w-4" />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* Link */}
        <div className="text-center mt-6 pt-6 border-t border-border">
          <p className="text-xs text-text-secondary">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
