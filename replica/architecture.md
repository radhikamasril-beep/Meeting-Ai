# Architecture: Meeting.ai Clone

Status: Planned
Recon map: `replica/recon.md`
Date: 2026-11-19

## 1. Tech Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| **Frontend & API** | Next.js 14+ (App Router) + Tailwind CSS + Lucide Icons | Cepat, responsif, modern UI matching Meeting.ai |
| **Database & ORM** | SQLite (Better-SQLite3) / Prisma | Zero-config lokal di drive D, tanpa biaya server |
| **Meeting Bot Runner** | Playwright (Node.js/Chromium) | Masuk link Google Meet / Teams secara otomatis |
| **Audio Capture** | Chromium Web Audio Stream Loopback | Rekam suara peserta meeting langsung dari tab browser bot |
| **AI Engine (STT & Summary)**| Gemini 2.5 Flash / Whisper API | Transkrip super cepat + akurasi tinggi bahasa Indonesia & campur Inggris |

## 2. System Architecture

```
[User Web UI] 
      │ (1) Submit GMeet Link / Upload Audio
      ▼
[Next.js API Routes / Server Action]
      │ (2) Trigger Bot Process
      ▼
[Playwright Bot Service]
      │ (3) Join GMeet, capture audio chunks (.wav)
      ▼
[Gemini Multimodal / Audio API]
      │ (4) Speech-to-Text with Speaker Diarization
      │ (5) Structured JSON: Summary, Key Topics, Action Items
      ▼
[Local DB (SQLite) & Disk Storage]
      │ (6) Save records in D:\meetingai-replica\data
      ▼
[User Web UI Dashboard]
```

## 3. Database Schema (Prisma/SQLite)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meetings (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'gmeet', 'teams', 'upload'
  status TEXT NOT NULL,   -- 'pending', 'recording', 'processing', 'completed', 'failed'
  audio_path TEXT,
  duration_sec INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE transcript_segments (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  speaker_name TEXT NOT NULL,
  start_ms INTEGER NOT NULL,
  end_ms INTEGER NOT NULL,
  text TEXT NOT NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

CREATE TABLE summaries (
  id TEXT PRIMARY KEY,
  meeting_id TEXT UNIQUE NOT NULL,
  overview TEXT NOT NULL,
  key_points TEXT NOT NULL, -- JSON Array string
  action_items TEXT NOT NULL, -- JSON Array string [{task, assignee, deadline}]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
```

## 4. Build Phases

* **Phase 1**: Inisialisasi project Next.js + Tailwind + SQLite di `D:\meetingai-replica`.
* **Phase 2**: Service Audio & AI Processor (upload file audio -> Gemini API -> transkrip + ringkasan + task).
* **Phase 3**: UI Dashboard & Interactive Transcript Player (replika persis Meeting.ai).
* **Phase 4**: Playwright Bot Google Meet automation script.
