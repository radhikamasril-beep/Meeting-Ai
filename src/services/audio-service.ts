import fs from "node:fs";
import path from "node:path";

export interface AudioMetadata {
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

const ALLOWED_AUDIO_EXT = new Set([".mp3", ".wav", ".m4a", ".ogg", ".webm", ".aac"]);

export const AudioService = {
  // Validate and get MIME type from extension
  getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".mp3":
        return "audio/mpeg";
      case ".wav":
        return "audio/wav";
      case ".m4a":
        return "audio/mp4";
      case ".ogg":
        return "audio/ogg";
      case ".webm":
        return "audio/webm";
      default:
        return "audio/mpeg";
    }
  },

  // Read audio file as base64 string
  readAsBase64(filePath: string): { data: string; mimeType: string } {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found at: ${filePath}`);
    }
    const buffer = fs.readFileSync(filePath);
    const mimeType = this.getMimeType(filePath);
    return {
      data: buffer.toString("base64"),
      mimeType,
    };
  },

  // Save uploaded buffer to data/recordings directory with strict whitelist
  saveAudioBuffer(buffer: Buffer, originalFilename: string): AudioMetadata {
    const ext = path.extname(originalFilename).toLowerCase();
    if (!ALLOWED_AUDIO_EXT.has(ext)) {
      throw new Error(`Format file audio '${ext}' tidak didukung. Harap unggah MP3, WAV, M4A, OGG, atau WebM.`);
    }

    const recordingsDir = path.resolve(process.cwd(), "data", "recordings");
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    const uniqueName = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    const destinationPath = path.join(recordingsDir, uniqueName);

    fs.writeFileSync(destinationPath, buffer);

    return {
      filePath: destinationPath,
      fileName: uniqueName,
      mimeType: this.getMimeType(destinationPath),
      sizeBytes: buffer.length,
    };
  },
};
