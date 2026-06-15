import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { setToken, removeToken, getToken } from "../lib/auth";
import { User } from "../types";
import { useRouter } from "next/navigation";
import { logger } from "../lib/logger";

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query to fetch current user profile
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        logger.debug("useAuth: No token found in localStorage");
        return null;
      }
      try {
        logger.debug("useAuth: Fetching profile from /auth/me");
        const response = await api.get("/auth/me");
        const profile = response.data.user || response.data;
        logger.info(`useAuth: Session active for user: ${profile.email} (${profile.role})`);
        return profile;
      } catch (err) {
        logger.error("useAuth: Profile retrieval failed. Clearing token.", err);
        removeToken();
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      logger.info("useAuth: Initiating login request", credentials.email);
      const response = await api.post("/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      logger.info("useAuth: Login success. Setting token.", data.user || data);
      if (data.token) {
        setToken(data.token);
      }
      queryClient.setQueryData(["auth-user"], data.user || data);
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      router.push("/");
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      logger.info("useAuth: Initiating registration request", credentials.email);
      const response = await api.post("/auth/register", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      logger.info("useAuth: Registration success. Setting token.", data.user || data);
      if (data.token) {
        setToken(data.token);
      }
      queryClient.setQueryData(["auth-user"], data.user || data);
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      router.push("/");
    },
  });

  // Logout utility
  const logout = () => {
    logger.info("useAuth: Executing sign-out. Clearing JWT and local storage caches.");
    removeToken();
    queryClient.setQueryData(["auth-user"], null);
    queryClient.clear();
    router.push("/sign-in");
  };

  return {
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    isError,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
    refetchUser: refetch,
  };
}
