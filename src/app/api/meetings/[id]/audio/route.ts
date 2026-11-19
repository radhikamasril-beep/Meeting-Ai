import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { MeetingRepository } from "@/lib/db";
import { AudioService } from "@/services/audio-service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const meeting = MeetingRepository.getById(params.id);
    if (!meeting || !meeting.audio_path) {
      return NextResponse.json({ success: false, error: "Audio tidak ditemukan" }, { status: 404 });
    }

    const recordingsDir = path.resolve(process.cwd(), "data", "recordings");
    const resolvedPath = path.resolve(meeting.audio_path);

    // Path traversal check
    if (!resolvedPath.startsWith(recordingsDir + path.sep)) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ success: false, error: "File audio fisik tidak ada di disk" }, { status: 404 });
    }

    const stat = fs.statSync(resolvedPath);
    const fileSize = stat.size;
    const mimeType = AudioService.getMimeType(resolvedPath);
    const rangeHeader = req.headers.get("range");

    // Support HTTP 206 Partial Content for smooth seeking & scrubbing
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${fileSize}` },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(resolvedPath, { start, end });
      const webStream = Readable.toWeb(fileStream);

      return new Response(webStream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": mimeType,
        },
      });
    }

    // Full Stream fallback
    const fileStream = fs.createReadStream(resolvedPath);
    const webStream = Readable.toWeb(fileStream);

    return new Response(webStream as any, {
      status: 200,
      headers: {
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Content-Type": mimeType,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
