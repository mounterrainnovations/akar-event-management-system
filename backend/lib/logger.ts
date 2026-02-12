import { createLogger, format, transports } from "winston";
import TransportStream from "winston-transport";

const serviceName = "ems-awg-backend";
const isProduction = process.env.NODE_ENV === "production";

type LogMode = "basic" | "errors" | "full";

function isLogEnabled() {
  return process.env.LOG_ENABLED?.toLowerCase() !== "false";
}

function getLogMode(): LogMode {
  const raw = process.env.LOG_MODE?.toLowerCase();
  if (raw === "errors" || raw === "full") {
    return raw;
  }
  return "basic";
}

function getLogLevel() {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  const mode = getLogMode();
  if (mode === "errors") {
    return "error";
  }
  if (mode === "full") {
    return isProduction ? "debug" : "silly";
  }
  return "info";
}

const level = getLogLevel();
const silent = !isLogEnabled();

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ level: logLevel, message, timestamp, ...meta }) => {
    const metaEntries = Object.entries(meta);
    const metaText = metaEntries.length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${logLevel}] ${message}${metaText}`;
  }),
);

const jsonFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
);

export const logger = createLogger({
  level,
  silent,
  defaultMeta: { service: serviceName },
  format: isProduction ? jsonFormat : consoleFormat,
  transports: [new transports.Console()],
});

export function getLogger(context: string) {
  return logger.child({ context });
}

export function addLoggerTransport(transport: TransportStream) {
  logger.add(transport);
}
