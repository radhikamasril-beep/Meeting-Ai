import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getValidatedConfig } from "@/lib/config";

export async function GET() {
  const config = getValidatedConfig();
  return NextResponse.json({
    success: true,
    config: {
      AI_PROVIDER: config.AI_PROVIDER,
      ROUTER_BASE_URL: config.ROUTER_BASE_URL,
      ROUTER_MODEL: config.ROUTER_MODEL,
      ROUTER_API_KEY: config.ROUTER_API_KEY ? "••••••••" + config.ROUTER_API_KEY.slice(-6) : "",
      BOT_DISPLAY_NAME: config.BOT_DISPLAY_NAME,
      HEADLESS_BOT: config.HEADLESS_BOT,
      GEMINI_MODEL: config.GEMINI_MODEL,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const envPath = path.resolve(process.cwd(), ".env");
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

    const updateEnvVar = (key: string, val: string) => {
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${val}`);
      } else {
        envContent += `\n${key}=${val}`;
      }
    };

    if (body.AI_PROVIDER) updateEnvVar("AI_PROVIDER", body.AI_PROVIDER);
    if (body.ROUTER_BASE_URL) updateEnvVar("ROUTER_BASE_URL", body.ROUTER_BASE_URL);
    if (body.ROUTER_MODEL) updateEnvVar("ROUTER_MODEL", body.ROUTER_MODEL);
    if (body.ROUTER_API_KEY && !body.ROUTER_API_KEY.startsWith("••••")) {
      updateEnvVar("ROUTER_API_KEY", body.ROUTER_API_KEY);
    }
    if (body.BOT_DISPLAY_NAME) updateEnvVar("BOT_DISPLAY_NAME", body.BOT_DISPLAY_NAME);
    if (body.HEADLESS_BOT !== undefined) updateEnvVar("HEADLESS_BOT", String(body.HEADLESS_BOT));

    fs.writeFileSync(envPath, envContent.trim() + "\n", "utf-8");

    return NextResponse.json({ success: true, message: "Pengaturan berhasil disimpan ke .env" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
