import { NextResponse } from "next/server";
import { MeetingRepository } from "@/lib/db";
import { formatTimestamp, formatDuration } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "markdown";
    const meeting = MeetingRepository.getById(params.id);

    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    if (format === "markdown") {
      let md = `# Notulensi Rapat: ${meeting.title}\n\n`;
      md += `- **Platform**: ${meeting.platform.toUpperCase()}\n`;
      md += `- **Waktu**: ${new Date(meeting.created_at).toLocaleString("id-ID")}\n`;
      md += `- **Durasi**: ${formatDuration(meeting.duration_sec)}\n\n`;

      md += `## 1. Ringkasan Eksekutif\n\n${meeting.summary?.overview || "Belum ada ringkasan."}\n\n`;

      if (meeting.summary?.key_points && meeting.summary.key_points.length > 0) {
        md += `## 2. Poin-Poin Utama Diskusi\n\n`;
        meeting.summary.key_points.forEach((pt, idx) => {
          md += `${idx + 1}. ${pt}\n`;
        });
        md += `\n`;
      }

      if (meeting.summary?.action_items && meeting.summary.action_items.length > 0) {
        md += `## 3. Action Items (Tugas & PIC)\n\n`;
        meeting.summary.action_items.forEach((item) => {
          md += `- [ ] **${item.task}** (PIC: ${item.assignee || "Belum ditentukan"} | Target: ${item.deadline || "Segera"})\n`;
        });
        md += `\n`;
      }

      md += `## 4. Transkrip Lengkap Percakapan\n\n`;
      meeting.transcripts.forEach((t) => {
        md += `**[${formatTimestamp(t.start_ms)}] ${t.speaker_name}**:\n${t.text}\n\n`;
      });

      return new Response(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="notula_${meeting.id}.md"`,
        },
      });
    }

    if (format === "txt") {
      let txt = `NOTULENSI RAPAT: ${meeting.title.toUpperCase()}\n`;
      txt += `Tanggal: ${new Date(meeting.created_at).toLocaleString("id-ID")}\n`;
      txt += `Durasi: ${formatDuration(meeting.duration_sec)}\n`;
      txt += `--------------------------------------------------------\n\n`;
      txt += `RINGKASAN EKSEKUTIF:\n${meeting.summary?.overview || "-"}\n\n`;
      txt += `ACTION ITEMS:\n`;
      meeting.summary?.action_items?.forEach((item, i) => {
        txt += `${i + 1}. ${item.task} (PIC: ${item.assignee || "-"}, Target: ${item.deadline || "-"})\n`;
      });
      txt += `\nTRANSKRIP:\n`;
      meeting.transcripts.forEach((t) => {
        txt += `[${formatTimestamp(t.start_ms)}] ${t.speaker_name}: ${t.text}\n`;
      });

      return new Response(txt, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="notula_${meeting.id}.txt"`,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Format tidak didukung" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
