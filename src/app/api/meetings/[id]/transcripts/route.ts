import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { transcriptId, speaker_name, text } = await req.json();

    if (!transcriptId) {
      return NextResponse.json({ success: false, error: "transcriptId diperlukan" }, { status: 400 });
    }

    if (speaker_name !== undefined && text !== undefined) {
      db.prepare(`UPDATE transcript_segments SET speaker_name = ?, text = ? WHERE id = ? AND meeting_id = ?`).run(
        speaker_name,
        text,
        transcriptId,
        params.id
      );
    } else if (speaker_name !== undefined) {
      db.prepare(`UPDATE transcript_segments SET speaker_name = ? WHERE id = ? AND meeting_id = ?`).run(
        speaker_name,
        transcriptId,
        params.id
      );
    } else if (text !== undefined) {
      db.prepare(`UPDATE transcript_segments SET text = ? WHERE id = ? AND meeting_id = ?`).run(
        text,
        transcriptId,
        params.id
      );
    }

    return NextResponse.json({ success: true, message: "Transkrip berhasil diperbarui" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
