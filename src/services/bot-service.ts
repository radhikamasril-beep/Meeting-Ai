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
  // Launch Chromium with virtual media devices & audio permissions
  async launchBrowser(headless: boolean = true) {
    const browser = await chromium.launch({
      headless,
      args: [
        "--use-fake-ui-for-media-stream", // auto-allow mic & cam prompts
        "--use-fake-device-for-media-stream",
        "--disable-blink-features=AutomationControlled", // avoid anti-bot detection
        "--autoplay-policy=no-user-gesture-required",
        "--enable-audio-service-sandbox=false",
      ],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      permissions: ["microphone", "camera"],
    });

    return { browser, context };
  },

  // Join Google Meet, auto-mute mic, turn off cam, input name, and join
  async joinGoogleMeet(session: BotSession, botName?: string): Promise<void> {
    const config = getValidatedConfig();
    const displayName = botName || config.BOT_DISPLAY_NAME;
    session.status = "joining";

    const { browser, context } = await this.launchBrowser(config.HEADLESS_BOT);
    session.browser = browser;
    session.context = context;
    const page = await context.newPage();
    session.page = page;

    try {
      console.log(`[Bot] Navigating to Google Meet: ${session.meetingUrl}`);
      await page.goto(session.meetingUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

      // Wait 3 seconds for UI stabilization
      await page.waitForTimeout(3000);

      // 1. Turn off Microphone & Camera buttons before joining
      const muteMicSelectors = [
        'div[data-is-muted="false"][aria-label*="microphone" i]',
        'div[data-is-muted="false"][aria-label*="mikrofon" i]',
        'button[aria-label*="turn off microphone" i]',
        'button[aria-label*="matikan mikrofon" i]',
      ];
      for (const sel of muteMicSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click().catch(() => {});
          break;
        }
      }

      const turnOffCamSelectors = [
        'div[aria-label*="turn off camera" i]',
        'div[aria-label*="matikan kamera" i]',
        'button[aria-label*="turn off camera" i]',
        'button[aria-label*="matikan kamera" i]',
      ];
      for (const sel of turnOffCamSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click().catch(() => {});
          break;
        }
      }

      // 2. Input Bot Name if requested
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

      // 3. Click "Ask to join" or "Join now"
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
      console.log("[Bot] Successfully in meeting room / waiting room.");
    } catch (err: any) {
      console.error("[Bot] Join failed:", err.message);
      session.status = "error";
      throw err;
    }
  },

  // Setup client-side Web Audio MediaRecorder inside page
  async startInTabAudioRecording(page: Page, meetingId: string): Promise<string> {
    const recordingsDir = path.resolve(process.cwd(), "data", "recordings");
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }
    const outputFile = path.join(recordingsDir, `meet_${meetingId}_${Date.now()}.webm`);

    // Inject Web Audio listener to capture all tab sounds
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
        recorder.start(5000); // chunk every 5 seconds
        (window as any).__recorder = recorder;
      }).catch(console.error);
    });

    return outputFile;
  },

  // Leave meeting and cleanup browser
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
      if (session.browser) {
        await session.browser.close().catch(() => {});
      }
    } catch (err) {
      console.warn("[Bot] Cleanup warning:", err);
    } finally {
      session.status = "ended";
    }
  },
};
