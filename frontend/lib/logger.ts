const isDev = process.env.NODE_ENV === "development" || typeof window !== "undefined";

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`%c[ViewTube DEBUG] ${message}`, "color: #7f8c8d; font-weight: 500;", ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`%c[ViewTube INFO] 🚀 ${message}`, "color: #3498db; font-weight: bold;", ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.warn(`%c[ViewTube WARN] ⚠️ ${message}`, "color: #f39c12; font-weight: bold;", ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`%c[ViewTube ERROR] ❌ ${message}`, "color: #e74c3c; font-weight: bold;", ...args);
  },
};
export type AppLogger = typeof logger;
