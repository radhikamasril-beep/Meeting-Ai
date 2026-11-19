import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required for Speech-to-Text & Summary"),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
  DATABASE_URL: z.string().default("file:./data/db/meetingai.sqlite"),
  STORAGE_RECORDINGS_PATH: z.string().default("./data/recordings"),
  BOT_DISPLAY_NAME: z.string().default("AI Meeting Note Taker"),
  HEADLESS_BOT: z.string().transform((val) => val === "true").default("true"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function getValidatedConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.warn("⚠️ Warning: Environment config validation issues:", result.error.format());
    return {
      PORT: 3000,
      NODE_ENV: "development",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
      GEMINI_MODEL: "gemini-3.8-flash",
      DATABASE_URL: "file:./data/db/meetingai.sqlite",
      STORAGE_RECORDINGS_PATH: "./data/recordings",
      BOT_DISPLAY_NAME: "AI Meeting Note Taker",
      HEADLESS_BOT: true,
    };
  }
  return result.data;
}
