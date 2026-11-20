import { chromium, BrowserContext, Page } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { getValidatedConfig } from "../lib/config";

export interface BotSession {
  meetingId: string;
  meetingUrl: string;
  browser: any | null;
  context: BrowserContext | null;
  page: Page | null;
  status: "idle" | "joining" | "in-meeting" | "leaving" | "ended" | "error";
  recordingPath: string | null;
}

export const PlaywrightBotService = {
  // Launch persistent context with virtual media devices & audio permissions
  async launchBrowser(headless: boolean = true) {
    const userDataDir = path.resolve(process.cwd(), "data", "browser_profile");
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless,
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--disable-blink-features=AutomationControlled",
        "--autoplay-policy=no-user-gesture-required",
        "--enable-audio-service-sandbox=false",
      ],
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      permissions: ["microphone", "camera"],
    });

    return { context };
  },

  // Join Google Meet using logged-in persistent session
  async joinGoogleMeet(session: BotSession, botName?: string): Promise<void> {
    const config = getValidatedConfig();
    const displayName = botName || config.BOT_DISPLAY_NAME;
    session.status = "joining";

    const { context } = await this.launchBrowser(config.HEADLESS_BOT);
    session.context = context;
    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
    session.page = page;

    try {
      console.log(`[Bot] Navigating to Google Meet: ${session.meetingUrl}`);
      await page.goto(session.meetingUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(4000);

      // 1. Mute Mic
      const muteMicSelectors = [
        'div[data-is-muted="false"][aria-label*="microphone" i]',
        'div[data-is-muted="false"][aria-label*="mikrofon" i]',
        'button[aria-label*="turn off microphone" i]',
        'button[aria-label*="matikan mikrofon" i]',
        'button[data-tooltip*="microphone" i]',
      ];
      for (const sel of muteMicSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click().catch(() => {});
          break;
        }
      }

      // 2. Turn off Camera
      const turnOffCamSelectors = [
        'div[data-is-muted="false"][aria-label*="camera" i]',
        'div[data-is-muted="false"][aria-label*="kamera" i]',
        'button[aria-label*="turn off camera" i]',
        'button[aria-label*="matikan kamera" i]',
        'button[data-tooltip*="camera" i]',
      ];
      for (const sel of turnOffCamSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click().catch(() => {});
          break;
        }
      }

      // 3. Fill Name if requested (guest mode fallback)
      const nameInputSelectors = [
        'input[type="text"][placeholder*="name" i]',
        'input[type="text"][placeholder*="nama" i]',
        'input[aria-label*="your name" i]',
        'input[aria-label*="nama anda" i]',
      ];
      for (const sel of nameInputSelectors) {
        const input = page.locator(sel).first();
        if (await input.isVisible().catch(() => false)) {
          await input.fill(displayName);
          break;
        }
      }

      // 4. Click Join / Ask to join button
      const joinBtnSelectors = [
        '//button[contains(., "Ask to join")]',
        '//button[contains(., "Join now")]',
        '//button[contains(., "Minta bergabung")]',
        '//button[contains(., "Gabung sekarang")]',
        'button[jsname="Qx7uuf"]',
      ];
      for (const sel of joinBtnSelectors) {
        const joinBtn = page.locator(sel).first();
        if (await joinBtn.isVisible().catch(() => false)) {
          await joinBtn.click().catch(() => {});
          console.log("[Bot] Clicked Join Meeting button!");
          break;
        }
      }

      session.status = "in-meeting";
      console.log("[Bot] Successfully joined / requested admission.");
    } catch (err: any) {
      console.error("[Bot] Join failed:", err.message);
      session.status = "error";
      throw err;
    }
  },

  // Setup client-side Web Audio MediaRecorder
  async startInTabAudioRecording(page: Page, meetingId: string): Promise<string> {
    const recordingsDir = path.resolve(process.cwd(), "data", "recordings");
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }
    const outputFile = path.join(recordingsDir, `meet_${meetingId}_${Date.now()}.webm`);

    await page.evaluate(() => {
      (window as any).__recordedChunks = [];
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            const reader = new FileReader();
            reader.onloadend = () => {
              (window as any).__recordedChunks.push(reader.result);
            };
            reader.readAsDataURL(e.data);
          }
        };
        recorder.start(5000);
        (window as any).__recorder = recorder;
      }).catch(console.error);
    });

    return outputFile;
  },

  // Leave meeting and cleanup browser context
  async leaveMeeting(session: BotSession): Promise<void> {
    session.status = "leaving";
    try {
      if (session.page) {
        const leaveBtnSelectors = [
          'button[aria-label*="Leave call" i]',
          'button[aria-label*="Tinggalkan panggilan" i]',
          'button[jsname="CQylAd"]',
        ];
        for (const sel of leaveBtnSelectors) {
          const btn = session.page.locator(sel).first();
          if (await btn.isVisible().catch(() => false)) {
            await btn.click().catch(() => {});
            break;
          }
        }
        await session.page.waitForTimeout(1000);
      }
      if (session.context) {
        await session.context.close().catch(() => {});
      }
    } catch (err) {
      console.warn("[Bot] Cleanup warning:", err);
    } finally {
      session.status = "ended";
    }
  },
};
