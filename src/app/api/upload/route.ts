import { NextResponse } from "next/server";
import { AudioService } from "@/services/audio-service";
import { MeetingRepository } from "@/lib/db";
import { MeetingOrchestrator } from "@/services/orchestrator";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Rekaman Unggahan";

    if (!file) {
      return NextResponse.json({ success: false, error: "File audio tidak ditemukan" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const savedAudio = AudioService.saveAudioBuffer(buffer, file.name);

    // Create DB entry
    const meetingId = `mtg_upl_${Date.now()}`;
    const newMeeting = MeetingRepository.create({
      id: meetingId,
      title,
      platform: "upload",
      status: "pending",
      audio_path: savedAudio.filePath,
      duration_sec: 0,
    });

    // Run AI processing pipeline in background
    MeetingOrchestrator.processAudioMeeting(meetingId, savedAudio.filePath).catch((err) => {
      console.error("Background AI process error:", err);
    });

    return NextResponse.json({ success: true, meeting: newMeeting });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
