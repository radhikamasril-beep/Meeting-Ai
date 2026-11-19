export type MeetingPlatform = "gmeet" | "zoom" | "teams" | "upload";
export type MeetingStatus = "pending" | "recording" | "processing" | "completed" | "failed";

export interface Meeting {
  id: string;
  title: string;
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
  key_points: string[]; // parsed from JSON
  action_items: ActionItem[]; // parsed from JSON
  created_at: string;
}

export interface MeetingWithDetails extends Meeting {
  transcripts: TranscriptSegment[];
  summary: Summary | null;
}
