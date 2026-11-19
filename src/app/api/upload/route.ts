import { NextResponse } from "next/server";
import { AudioService } from "@/services/audio-service";
import { MeetingRepository } from "@/lib/db";
import { MeetingOrchestrator } from "@/services/orchestrator";

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200 MB maximum

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const title = (formData.get("title") as string)?.trim() || "Rekaman Unggahan";
    const category = (formData.get("category") as string)?.trim() || "Umum";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: "File audio tidak ditemukan atau tidak valid" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: "Ukuran file melebihi batas maksimum 200MB" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let savedAudio;
    try {
      savedAudio = AudioService.saveAudioBuffer(buffer, file.name);
    } catch (valErr: any) {
      return NextResponse.json({ success: false, error: valErr.message }, { status: 400 });
    }

    // Create DB entry
    const meetingId = `mtg_upl_${Date.now()}`;
    const newMeeting = MeetingRepository.create({
      id: meetingId,
      title,
      category,
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
