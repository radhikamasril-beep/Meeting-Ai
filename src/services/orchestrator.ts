import { AudioService } from "./audio-service";
import { AIService } from "./ai-service";
import { KnowledgeSyncService } from "./knowledge-sync";
import { MeetingRepository } from "../lib/db";
import { MeetingWithDetails } from "../types/meeting";

export const MeetingOrchestrator = {
  // Process an audio file for a given meeting ID
  async processAudioMeeting(meetingId: string, audioFilePath: string): Promise<MeetingWithDetails> {
    try {
      // 1. Update status to processing
      MeetingRepository.updateStatus(meetingId, "processing", undefined, audioFilePath);

      // 2. Run Gemini 3.8 Flash pipeline
      const aiResult = await AIService.processMeetingAudio(audioFilePath);

      // 3. Save transcript segments
      const transcriptRecords = aiResult.transcripts.map((t, index) => ({
        id: `tr_${meetingId}_${index}_${Date.now()}`,
        speaker_name: t.speaker_name,
        start_ms: t.start_ms,
        end_ms: t.end_ms,
        text: t.text,
      }));
      MeetingRepository.saveTranscripts(meetingId, transcriptRecords);

      // 4. Save summary & action items
      MeetingRepository.saveSummary(meetingId, aiResult.summary);

      // 5. Calculate estimated duration from last transcript segment
      const lastSegment = aiResult.transcripts[aiResult.transcripts.length - 1];
      const estimatedDurationSec = lastSegment ? Math.ceil(lastSegment.end_ms / 1000) : 0;

      // 6. Finalize meeting status
      MeetingRepository.updateStatus(meetingId, "completed", estimatedDurationSec, audioFilePath);

      // 7. Auto-sync to Antigravity knowledge base
      try {
        KnowledgeSyncService.syncAllMeetingsToKnowledge();
      } catch (syncErr) {
        console.warn("[Orchestrator] Warning syncing to knowledge base:", syncErr);
      }

      const completeMeeting = MeetingRepository.getById(meetingId);
      if (!completeMeeting) {
        throw new Error("Meeting not found after completion");
      }
      return completeMeeting;
    } catch (error: any) {
      console.error(`Error processing meeting ${meetingId}:`, error);
      MeetingRepository.updateStatus(meetingId, "failed");
      throw error;
    }
  },
};
