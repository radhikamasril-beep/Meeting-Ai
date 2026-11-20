import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

(async () => {
  const userDataDir = path.resolve(process.cwd(), "data", "browser_profile");
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  console.log("==================================================================");
  console.log("   MEETING.AI - LOGIN AKUN GOOGLE UNTUK BOT PERSISTENT CONTEXT   ");
  console.log("==================================================================");
  console.log("\nBrowser Chromium akan terbuka di layar Anda.");
  console.log("Silakan login ke akun Google Anda (email & password).");
  console.log("Sesi login Anda akan tersimpan otomatis di: data/browser_profile\n");
  console.log("Setelah selesai login, cukup TUTUP jendela browser Chromium tersebut.\n");

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Buka browser visual di layar agar user bisa login
    args: [
      "--disable-blink-features=AutomationControlled",
    ],
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  await page.goto("https://accounts.google.com/");

  // Tunggu sampai user menutup browser sendiri
  await new Promise<void>((resolve) => {
    context.on("close", () => {
      console.log("✅ Jendela browser ditutup. Sesi login akun Google berhasil disimpan!");
      resolve();
    });
  });
})();
