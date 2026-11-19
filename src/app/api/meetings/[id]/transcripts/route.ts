import { NextResponse } from "next/server";
import db from "@/lib/db";
import { patchTranscriptSchema } from "@/types/meeting";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Format JSON tidak valid" }, { status: 400 });
    }

    const parseResult = patchTranscriptSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0]?.message || "Validasi gagal" },
        { status: 400 }
      );
    }

    const { transcriptId, speaker_name, text } = parseResult.data;

    let result;
    if (speaker_name !== undefined && text !== undefined) {
      result = db.prepare(`UPDATE transcript_segments SET speaker_name = ?, text = ? WHERE id = ? AND meeting_id = ?`).run(
        speaker_name,
        text,
        transcriptId,
        params.id
      );
    } else if (speaker_name !== undefined) {
      result = db.prepare(`UPDATE transcript_segments SET speaker_name = ? WHERE id = ? AND meeting_id = ?`).run(
        speaker_name,
        transcriptId,
        params.id
      );
    } else if (text !== undefined) {
      result = db.prepare(`UPDATE transcript_segments SET text = ? WHERE id = ? AND meeting_id = ?`).run(
        text,
        transcriptId,
        params.id
      );
    }

    if (!result || result.changes === 0) {
      return NextResponse.json({ success: false, error: "Segmen transkrip tidak ditemukan" }, { status: 404 });
    }

    // Auto re-sync edited transcript to knowledge base
    try {
      const { KnowledgeSyncService } = await import("@/services/knowledge-sync");
      KnowledgeSyncService.syncMeeting(params.id);
    } catch (syncErr) {
      console.warn("Sync error after edit:", syncErr);
    }

    return NextResponse.json({ success: true, message: "Transkrip berhasil diperbarui dan disinkronkan ke knowledge base" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
