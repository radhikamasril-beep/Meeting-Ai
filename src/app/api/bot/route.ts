import { NextResponse } from "next/server";
import { BotManager } from "@/services/bot-manager";
import { MeetingRepository } from "@/lib/db";
import { botStartSchema } from "@/types/meeting";

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Format JSON tidak valid" }, { status: 400 });
    }

    const { action } = body;

    if (action === "start") {
      const parseResult = botStartSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: parseResult.error.errors[0]?.message || "Input bot tidak valid" },
          { status: 400 }
        );
      }

      const { meetingUrl, title, category, botName, meetingId } = parseResult.data;
      const id = meetingId || `mtg_bot_${Date.now()}`;

      // Check if duplicate meeting ID
      if (MeetingRepository.getById(id)) {
        return NextResponse.json({ success: false, error: "Meeting ID sudah ada" }, { status: 409 });
      }

      const newMeeting = MeetingRepository.create({
        id,
        title: title || "Rapat Google Meet",
        category: category || "Umum",
        platform: "gmeet",
        status: "recording",
        audio_path: null,
        duration_sec: 0,
      });

      await BotManager.startBotForMeeting(id, meetingUrl, botName);
      return NextResponse.json({ success: true, meeting: newMeeting });
    }

    if (action === "stop") {
      const { meetingId } = body;
      if (!meetingId || typeof meetingId !== "string") {
        return NextResponse.json({ success: false, error: "meetingId wajib disertakan" }, { status: 400 });
      }

      const meeting = MeetingRepository.getById(meetingId);
      if (!meeting) {
        return NextResponse.json({ success: false, error: "Meeting tidak ditemukan" }, { status: 404 });
      }

      await BotManager.stopBotAndFinalize(meetingId);
      return NextResponse.json({ success: true, message: "Bot meninggalkan meeting dan sedang memproses notula." });
    }

    return NextResponse.json({ success: false, error: "Action tidak dikenal (harus 'start' atau 'stop')" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
