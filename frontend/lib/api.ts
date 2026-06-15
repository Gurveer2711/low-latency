import axios from "axios";
import { getToken, removeToken } from "./auth";
import { logger } from "./logger";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Token automatically
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
      hasToken: !!token,
    });
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logger.error("API Request Interceptor Error", error);
    return Promise.reject(error);
  }
);

// Catch 401 and clear token / redirect to login
api.interceptors.response.use(
  (response) => {
    logger.debug(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    
    logger.error(`API Error: ${status || "Network"} ${method} ${url}`, {
      message: error.message,
      responseData: error.response?.data,
    });

    if (status === 401) {
      logger.warn("Session expired (401 Unauthorized). Wiping JWT and redirecting to Sign-in.");
      removeToken();
      // Ensure we don't end up in infinite redirect loops
      if (typeof window !== "undefined" && !window.location.pathname.includes("/sign-in") && !window.location.pathname.includes("/sign-up")) {
        window.location.href = "/sign-in";
      }
    }
    return Promise.reject(error);
  }
);
