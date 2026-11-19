import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { Meeting, TranscriptSegment, Summary, MeetingWithDetails } from "../types/meeting";

const DB_DIR = path.resolve(process.cwd(), "data", "db");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, "meetingai.sqlite");
const db = new DatabaseSync(DB_PATH);

// Initialize Tables (Langkah 10-13)
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Umum',
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    audio_path TEXT,
    duration_sec INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transcript_segments (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    speaker_name TEXT NOT NULL,
    start_ms INTEGER NOT NULL,
    end_ms INTEGER NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS summaries (
    id TEXT PRIMARY KEY,
    meeting_id TEXT UNIQUE NOT NULL,
    overview TEXT NOT NULL,
    key_points TEXT NOT NULL,
    action_items TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_transcripts_meeting_id ON transcript_segments(meeting_id);
  CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at DESC);
`);

export const MeetingRepository = {
  // Create new meeting
  create(meeting: Omit<Meeting, "created_at">): Meeting {
    const stmt = db.prepare(`
      INSERT INTO meetings (id, title, category, platform, status, audio_path, duration_sec)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    const row = stmt.get(
      meeting.id,
      meeting.title,
      meeting.category || "Umum",
      meeting.platform,
      meeting.status,
      meeting.audio_path,
      meeting.duration_sec
    ) as Meeting;
    return row;
  },

  // Update status and duration
  updateStatus(id: string, status: Meeting["status"], duration_sec?: number, audio_path?: string) {
    if (duration_sec !== undefined && audio_path !== undefined) {
      db.prepare(`UPDATE meetings SET status = ?, duration_sec = ?, audio_path = ? WHERE id = ?`).run(
        status,
        duration_sec,
        audio_path,
        id
      );
    } else if (duration_sec !== undefined) {
      db.prepare(`UPDATE meetings SET status = ?, duration_sec = ? WHERE id = ?`).run(status, duration_sec, id);
    } else {
      db.prepare(`UPDATE meetings SET status = ? WHERE id = ?`).run(status, id);
    }
  },

  // Get all meetings ordered by latest
  list(): Meeting[] {
    const stmt = db.prepare(`SELECT * FROM meetings ORDER BY created_at DESC`);
    return stmt.all() as unknown as Meeting[];
  },

  // Get single meeting with transcripts and summary
  getById(id: string): MeetingWithDetails | null {
    const meetingStmt = db.prepare(`SELECT * FROM meetings WHERE id = ?`);
    const meeting = meetingStmt.get(id) as unknown as Meeting | undefined;
    if (!meeting) return null;

    const transcriptStmt = db.prepare(`
      SELECT * FROM transcript_segments WHERE meeting_id = ? ORDER BY start_ms ASC
    `);
    const transcripts = transcriptStmt.all(id) as unknown as TranscriptSegment[];

    const summaryStmt = db.prepare(`SELECT * FROM summaries WHERE meeting_id = ?`);
    const summaryRow = summaryStmt.get(id) as unknown as {
      id: string;
      meeting_id: string;
      overview: string;
      key_points: string;
      action_items: string;
      created_at: string;
    } | undefined;

    let summary: Summary | null = null;
    if (summaryRow) {
      let keyPoints: string[] = [];
      let actionItems: any[] = [];
      try {
        keyPoints = JSON.parse(summaryRow.key_points);
      } catch {
        keyPoints = [];
      }
      try {
        actionItems = JSON.parse(summaryRow.action_items);
      } catch {
        actionItems = [];
      }

      summary = {
        id: summaryRow.id,
        meeting_id: summaryRow.meeting_id,
        overview: summaryRow.overview,
        key_points: keyPoints,
        action_items: actionItems,
        created_at: summaryRow.created_at,
      };
    }

    return {
      ...meeting,
      transcripts,
      summary,
    };
  },

  // Save batch transcripts
  saveTranscripts(meetingId: string, segments: Omit<TranscriptSegment, "meeting_id">[]) {
    const insertStmt = db.prepare(`
      INSERT INTO transcript_segments (id, meeting_id, speaker_name, start_ms, end_ms, text)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const seg of segments) {
      insertStmt.run(seg.id, meetingId, seg.speaker_name, seg.start_ms, seg.end_ms, seg.text);
    }
  },

  // Save or replace summary
  saveSummary(meetingId: string, summary: { overview: string; key_points: string[]; action_items: any[] }) {
    const id = `sum_${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO summaries (id, meeting_id, overview, key_points, action_items)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(meeting_id) DO UPDATE SET
        overview = excluded.overview,
        key_points = excluded.key_points,
        action_items = excluded.action_items
    `);
    stmt.run(
      id,
      meetingId,
      summary.overview,
      JSON.stringify(summary.key_points),
      JSON.stringify(summary.action_items)
    );
  },

  // Delete meeting
  delete(id: string) {
    db.prepare(`DELETE FROM meetings WHERE id = ?`).run(id);
  },
};

export default db;
