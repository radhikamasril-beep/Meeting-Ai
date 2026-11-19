import { NextResponse } from "next/server";
import fs from "node:fs";
import { MeetingRepository } from "@/lib/db";
import { AudioService } from "@/services/audio-service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const meeting = MeetingRepository.getById(params.id);
    if (!meeting || !meeting.audio_path) {
      return NextResponse.json({ success: false, error: "Audio file not found" }, { status: 404 });
    }

    if (!fs.existsSync(meeting.audio_path)) {
      return NextResponse.json({ success: false, error: "Physical audio file missing on disk" }, { status: 404 });
    }

    const stat = fs.statSync(meeting.audio_path);
    const mimeType = AudioService.getMimeType(meeting.audio_path);
    const fileStream = fs.createReadStream(meeting.audio_path);

    // Stream file buffer to browser
    return new Response(fileStream as any, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": stat.size.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
