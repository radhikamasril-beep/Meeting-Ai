# Recon map: Meeting.ai (Web App)

Scope: Core Meeting AI bot recording, transcription, diarization, and summary engine
For: Developer / Independent Builder
Date: 2026-11-19

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Landing & Product Page | https://meeting.ai/en/p | Feature overview, pricing plans, platform support |
| 2 | Billing & Model Tier | https://meeting.ai/en/p (dehydrated state) | Coin system, model access (`meeting-ai/memo-air-*`), livestream limits |

## Core loop

Record meetings (Zoom, Google Meet, Teams, or offline audio), auto-transcribe in real-time, label speakers, and generate actionable minutes + task lists.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Dashboard | `/dashboard` | View recent meetings, coin balance, quick join input | SearchBar, MeetingListCard, NewMeetingModal, CoinBadge | empty, filled |
| S02 | Live Recording / In-Meeting | `/meeting/:id/live` | Real-time audio monitoring & live transcribing | AudioVisualizer, LiveTranscriptStream, SpeakerTag, EndMeetingBtn | recording, paused, finalizing |
| S03 | Meeting Detail & Summary | `/meeting/:id` | Full transcript, AI summary, action items, audio player | WaveformPlayer, TranscriptList, ActionItemChecklist, CopyExportMenu | processing, ready |
| S04 | Upload Audio / File | `/upload` | Transcribe past recording / MP3 / WAV file | DragDropZone, LanguageSelector, ModelSelector, ProgressBar | idle, uploading, processing |
| S05 | Settings & Integrations | `/settings` | Connect Google Calendar / Zoom / Teams bot settings | IntegrationToggle, BotNameInput, LanguagePreference | active, disconnected |

## Flows

```
F01 Auto-Join or Quick-Join Meeting
    S01 (Paste Link GMeet/Zoom) -> S02 (Bot joins & captures audio) -> S03 (Summary & Action Items Ready)
    happy path clicks: 2
    edge: meeting host rejects bot, audio permission denied, poor connection

F02 Upload Offline Audio
    S01 -> S04 (Drop MP3/WAV) -> S03 (Transcript & Diarization)
    happy path clicks: 3
    edge: unsupported codec, file > size limit

F03 Export Summary & Tasks
    S03 (Click Export) -> Copy Markdown / Send to Google Docs / Download TXT
    happy path clicks: 2
    edge: clipboard denied
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, danger | default, hover, active, disabled, loading | all |
| AudioPlayer | waveform, compact | playing, paused, seeking, muted | S02, S03 |
| TranscriptSegment | speaker-left, speaker-right, system | default, selected, editing | S02, S03 |
| ActionItemCard | checkbox, editable | pending, completed | S03 |
| Modal | confirm, new-meeting, share | open, closing | S01, S03 |

## Inferred data model

```
User        id, name, email, avatar, created_at
            evidence: S01 auth profile
            confidence: high

Meeting     id, user_id, title, platform (gmeet/zoom/teams/upload), audio_url, duration, status, created_at
            evidence: S01 list, S03 detail
            confidence: high

Transcript  id, meeting_id, speaker_name, start_time_ms, end_time_ms, text
            evidence: S03 transcript view
            confidence: high

Summary     id, meeting_id, overview, key_points (json array), action_items (json array)
            evidence: S03 summary tabs
            confidence: high
```

Relationships:
`User 1-n Meeting`, `Meeting 1-n Transcript`, `Meeting 1-1 Summary`

## Feature matrix

See `features.csv`. Must: 7, should: 5, could: 3, skip: 2.

## Out of scope (cannot or should not be cloned)

- Proprietary paid coin system (clone use flat rate or direct BYOK - Bring Your Own Key).
- Third party SMS / WhatsApp notification infrastructure.

## Size

Screens: 5, flows: 3, entities: 4. Hard parts: Real-time audio stream capture via headless browser, speaker diarization. Size: M.
