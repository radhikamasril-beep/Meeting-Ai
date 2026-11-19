import { z } from "zod";

export const meetingPlatformSchema = z.enum(["gmeet", "zoom", "teams", "upload"]);
export const meetingStatusSchema = z.enum(["pending", "recording", "processing", "completed", "failed"]);

export type MeetingPlatform = z.infer<typeof meetingPlatformSchema>;
export type MeetingStatus = z.infer<typeof meetingStatusSchema>;

export interface Meeting {
  id: string;
  title: string;
  category?: string;
  platform: MeetingPlatform;
  status: MeetingStatus;
  audio_path: string | null;
  duration_sec: number;
  created_at: string;
}

export interface TranscriptSegment {
  id: string;
  meeting_id: string;
  speaker_name: string;
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface ActionItem {
  task: string;
  assignee?: string;
  deadline?: string;
  completed?: boolean;
}

export interface Summary {
  id: string;
  meeting_id: string;
  overview: string;
  key_points: string[];
  action_items: ActionItem[];
  created_at: string;
}

export interface MeetingWithDetails extends Meeting {
  transcripts: TranscriptSegment[];
  summary: Summary | null;
}

// Validation Schemas for API Requests
export const createMeetingSchema = z.object({
  title: z.string().trim().min(1, "Judul tidak boleh kosong").max(255).default("Rapat Tanpa Judul"),
  category: z.string().trim().max(100).default("Umum"),
  platform: meetingPlatformSchema.default("upload"),
});

export const patchTranscriptSchema = z.object({
  transcriptId: z.string().min(1, "transcriptId wajib diisi"),
  speaker_name: z.string().trim().max(100).optional(),
  text: z.string().trim().optional(),
}).refine((data) => data.speaker_name !== undefined || data.text !== undefined, {
  message: "Minimal salah satu dari speaker_name atau text harus diisi",
});

export const botStartSchema = z.object({
  action: z.literal("start"),
  meetingUrl: z.string().url().refine((url) => {
    try {
      const u = new URL(url);
      return (
        u.protocol === "https:" &&
        (u.hostname === "meet.google.com" ||
          u.hostname.endsWith(".zoom.us") ||
          u.hostname.endsWith(".teams.microsoft.com"))
      );
    } catch {
      return false;
    }
  }, "meetingUrl harus URL HTTPS valid Google Meet, Zoom, atau Teams"),
  title: z.string().trim().max(255).optional(),
  category: z.string().trim().max(100).optional(),
  botName: z.string().trim().max(100).optional(),
  meetingId: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/).optional(),
});
