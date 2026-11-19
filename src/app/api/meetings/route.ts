import { NextResponse } from "next/server";
import { MeetingRepository } from "@/lib/db";
import { createMeetingSchema } from "@/types/meeting";

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
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Format request JSON tidak valid" }, { status: 400 });
    }

    const parseResult = createMeetingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0]?.message || "Validasi gagal" },
        { status: 400 }
      );
    }

    const { title, platform, category } = parseResult.data;
    const newMeeting = MeetingRepository.create({
      id: `mtg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      category,
      platform,
      status: "pending",
      audio_path: null,
      duration_sec: 0,
    });

    return NextResponse.json({ success: true, meeting: newMeeting });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
