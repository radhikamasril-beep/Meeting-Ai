import { PlaywrightBotService, BotSession } from "./bot-service";
import { MeetingRepository } from "../lib/db";
import { MeetingOrchestrator } from "./orchestrator";

class BotManagerService {
  private activeSessions = new Map<string, BotSession>();

  // Start autonomous bot for a meeting link
  async startBotForMeeting(meetingId: string, meetingUrl: string, botName?: string): Promise<BotSession> {
    const existing = this.activeSessions.get(meetingId);
    if (existing && (existing.status === "joining" || existing.status === "in-meeting")) {
      return existing;
    }

    const session: BotSession = {
      meetingId,
      meetingUrl,
      browser: null,
      context: null,
      page: null,
      status: "idle",
      recordingPath: null,
    };
    this.activeSessions.set(meetingId, session);

    // Run async bot process in background
    (async () => {
      try {
        MeetingRepository.updateStatus(meetingId, "recording");
        await PlaywrightBotService.joinGoogleMeet(session, botName);

        if (session.page) {
          session.recordingPath = await PlaywrightBotService.startInTabAudioRecording(session.page, meetingId);
        }
      } catch (err: any) {
        console.error(`[BotManager] Error for meeting ${meetingId}:`, err);
        MeetingRepository.updateStatus(meetingId, "failed");
        session.status = "error";
      }
    })();

    return session;
  }

  // Stop bot, leave meeting, and trigger AI processing pipeline
  async stopBotAndFinalize(meetingId: string): Promise<void> {
    const session = this.activeSessions.get(meetingId);
    if (!session) {
      console.warn(`[BotManager] No active session found for ${meetingId}`);
      return;
    }

    try {
      await PlaywrightBotService.leaveMeeting(session);
      this.activeSessions.delete(meetingId);

      // Trigger AI transcription & summary if recording exists
      if (session.recordingPath) {
        await MeetingOrchestrator.processAudioMeeting(meetingId, session.recordingPath);
      } else {
        MeetingRepository.updateStatus(meetingId, "completed");
      }
    } catch (err) {
      console.error(`[BotManager] Finalize failed for ${meetingId}:`, err);
      MeetingRepository.updateStatus(meetingId, "failed");
    }
  }

  // Get status of active session
  getSessionStatus(meetingId: string): BotSession["status"] | "not-found" {
    const session = this.activeSessions.get(meetingId);
    return session ? session.status : "not-found";
  }
}

export const BotManager = new BotManagerService();
