/**
 * Seedha Properties - Structured Production Logger (JSON / CloudWatch Compatible)
 * Formats operational and security logs into structured JSON with correlation IDs
 * and automatic redaction of sensitive credentials, PII, and authorization tokens.
 */

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "SECURITY";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "jwt",
  "secret",
  "authorization",
  "cookie",
  "aadhaar",
  "pan",
  "creditcard",
  "cvv",
  "apikey",
  "refresh_token",
  "access_token",
]);

/**
 * Recursively redacts sensitive keys from log metadata payloads.
 */
export function redactSensitiveData(data: any): any {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (
      SENSITIVE_KEYS.has(lowerKey) ||
      lowerKey.includes("password") ||
      lowerKey.includes("secret")
    ) {
      clean[key] = "[REDACTED]";
    } else if (value !== null && typeof value === "object") {
      clean[key] = redactSensitiveData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  error?: string;
  meta?: Record<string, any>;
}

export class Logger {
  private serviceName: string;

  constructor(serviceName: string = "seedha-backend") {
    this.serviceName = serviceName;
  }

  private write(level: LogLevel, message: string, meta: Record<string, any> = {}) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: meta.correlationId || meta.requestId || undefined,
      ...redactSensitiveData(meta),
    };

    // Format as single-line structured JSON for CloudWatch ingestion
    const logString = JSON.stringify({ service: this.serviceName, ...entry });

    if (level === "ERROR" || level === "SECURITY") {
      console.error(logString);
    } else if (level === "WARN") {
      console.warn(logString);
    } else {
      console.log(logString);
    }
  }

  debug(message: string, meta: Record<string, any> = {}) {
    if (process.env.NODE_ENV !== "production") {
      this.write("DEBUG", message, meta);
    }
  }

  info(message: string, meta: Record<string, any> = {}) {
    this.write("INFO", message, meta);
  }

  warn(message: string, meta: Record<string, any> = {}) {
    this.write("WARN", message, meta);
  }

  error(message: string, meta: Record<string, any> = {}) {
    this.write("ERROR", message, meta);
  }

  security(message: string, meta: Record<string, any> = {}) {
    this.write("SECURITY", message, meta);
  }
}

export const logger = new Logger();
