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
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  CORS_ORIGIN: z.string().min(1).default("https://smtravelsinternational.com"),
  /** Server-volume root for uploaded files (passports/visas — OUTSIDE the web
   *  root; nginx never serves it). Prod: /var/www/SMTravels/uploads. */
  UPLOAD_DIR: z.string().min(1).default("uploads"),

  // ── outbound messaging — ALL optional. Missing credentials NEVER crash the
  //    app: senders fall back to log-only mode (see lib/notify.ts).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("SM Travels <no-reply@smtravel.com.bd>"),
  BULKSMSBD_API_KEY: z.string().optional(),
  BULKSMSBD_SENDER_ID: z.string().optional(),
  // WhatsApp (Meta Cloud API) + passport OCR — all optional: missing credentials
  // fall back to safe log-only / mock implementations (see lib/notify, lib/ocr).
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),
  OCR_API_URL: z.string().optional(),
  OCR_API_KEY: z.string().optional(),
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
