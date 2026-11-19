import { NextResponse } from "next/server";
import { BotManager } from "@/services/bot-manager";
import { MeetingRepository } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { action, meetingUrl, title, botName, meetingId } = await req.json();

    if (action === "start") {
      if (!meetingUrl) {
        return NextResponse.json({ success: false, error: "Link meeting diperlukan" }, { status: 400 });
      }

      const id = meetingId || `mtg_bot_${Date.now()}`;
      const newMeeting = MeetingRepository.create({
        id,
        title: title || "Rapat Google Meet",
        platform: "gmeet",
        status: "recording",
        audio_path: null,
        duration_sec: 0,
      });

      await BotManager.startBotForMeeting(id, meetingUrl, botName);
      return NextResponse.json({ success: true, meeting: newMeeting });
    }

    if (action === "stop") {
      if (!meetingId) {
        return NextResponse.json({ success: false, error: "meetingId diperlukan" }, { status: 400 });
      }
      await BotManager.stopBotAndFinalize(meetingId);
      return NextResponse.json({ success: true, message: "Bot meninggalkan meeting dan sedang memproses notula." });
    }

    return NextResponse.json({ success: false, error: "Action tidak valid" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
