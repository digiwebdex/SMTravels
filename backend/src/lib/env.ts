import "dotenv/config";
import { z } from "zod";

/**
 * Validated environment. Fail fast at boot if anything is missing/invalid
 * rather than discovering it mid-request.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(4030),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  CORS_ORIGIN: z.string().min(1).default("https://smtravelsinternational.com"),
  /** Server-volume root for uploaded files (passports/visas — OUTSIDE the web
   *  root; nginx never serves it). Prod: /var/www/SMTravels/uploads. */
  UPLOAD_DIR: z.string().min(1).default("uploads"),

  // ── outbound messaging — ALL optional. Missing credentials NEVER crash the
  //    app: senders fall back to log-only mode (see lib/notify.ts).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  // NOTE: z.coerce.boolean() treats the string "false" as true — parse explicitly.
  SMTP_SECURE: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => {
      if (typeof v === "boolean") return v;
      if (v == null || v === "") return false;
      return !["false", "0", "no", "off"].includes(String(v).trim().toLowerCase());
    }),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("SM Travels <no-reply@smtravel.com.bd>"),
  BULKSMSBD_API_KEY: z.string().optional(),
  BULKSMSBD_SENDER_ID: z.string().optional(),
  WASENDER_API_URL: z.string().optional(),
  WASENDER_API_TOKEN: z.string().optional(),
  WASENDER_PHONE_NUMBER_ID: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  /** Legacy Vision API-key auth — prefer GOOGLE_APPLICATION_CREDENTIALS. */
  GOOGLE_VISION_API_KEY: z.string().optional(),
  /** Path to Google Cloud Vision service-account JSON (ADC). */
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n" +
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
