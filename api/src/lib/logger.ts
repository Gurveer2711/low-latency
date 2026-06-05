import pino from "pino";

export const logger = pino({
  // use pino-pretty for readable logs in development
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty", // pretty print in dev
          options: {
            colorize: true, // add colors
            translateTime: "SYS:standard", // human readable time
            ignore: "pid,hostname", // hide noisy fields
          },
        }
      : undefined, // in production → raw JSON (for log aggregators)

  // default fields added to every log line
  base: {
    service: "api", // know which service logged this
  },

  // minimum log level to show
  level: process.env.LOG_LEVEL || "info",
});
