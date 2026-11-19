import { NextResponse } from "next/server";
import { MeetingRepository } from "@/lib/db";

export async function GET() {
  try {
    const meetings = MeetingRepository.list();
    return NextResponse.json({ success: true, meetings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, platform } = body;
    const newMeeting = MeetingRepository.create({
      id: `mtg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title || "Rapat Tanpa Judul",
      platform: platform || "upload",
      status: "pending",
      audio_path: null,
      duration_sec: 0,
    });
    return NextResponse.json({ success: true, meeting: newMeeting });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
