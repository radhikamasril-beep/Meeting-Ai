import { GoogleGenAI } from "@google/genai";
import { getValidatedConfig } from "@/lib/config";
import { AudioService } from "./audio-service";
import { ActionItem } from "@/types/meeting";

export interface AIProcessedMeeting {
  transcripts: Array<{
    speaker_name: string;
    start_ms: number;
    end_ms: number;
    text: string;
  }>;
  summary: {
    overview: string;
    key_points: string[];
    action_items: ActionItem[];
  };
}

export const AIService = {
  getClient(): GoogleGenAI {
    const config = getValidatedConfig();
    if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === "your_gemini_api_key_here") {
      throw new Error(
        "GEMINI_API_KEY belum diisi! Silakan masukkan API Key di file .env untuk memproses transkrip audio."
      );
    }
    return new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  },

  // Main pipeline: Audio -> Transcripts + Diarization + Structured Summary
  async processMeetingAudio(audioFilePath: string): Promise<AIProcessedMeeting> {
    const ai = this.getClient();
    const config = getValidatedConfig();
    const { data: base64Audio, mimeType } = AudioService.readAsBase64(audioFilePath);

    const systemInstruction = `
Kamu adalah AI Notulensi Rapat Profesional setara Meeting.ai.
Tugasmu:
1. Dengarkan rekaman audio rapat secara cermat. Rapat menggunakan Bahasa Indonesia atau campuran Bahasa Indonesia-Inggris (code-switching).
2. Lakukan SPEECH-TO-TEXT dan SPEAKER DIARIZATION (identifikasi siapa yang berbicara, tandai sebagai "Pembicara 1", "Pembicara 2", atau sebut nama orangnya jika namanya disebut dalam obrolan).
3. Berikan timestamp perkiraan (start_ms dan end_ms dalam satuan milidetik) untuk setiap segmen percakapan.
4. Buat RINGKASAN EKSEKUTIF yang komprehensif, poin-poin utama diskusi, dan DAFTAR TUGAS (Action Items) beserta PIC (penanggung jawab) dan batas waktu (deadline) jika ada.

KEMBALIKAN HANYA FORMAT JSON MURNI TANPA MARKDOWN BACKTICKS dengan skema persis berikut:
{
  "transcripts": [
    {
      "speaker_name": "string (contoh: 'Pembicara 1' atau 'Budi')",
      "start_ms": number,
      "end_ms": number,
      "text": "string (teks kalimat yang diucapkan)"
    }
  ],
  "summary": {
    "overview": "string (paragraf ringkasan eksekutif inti rapat)",
    "key_points": [
      "string (poin penting 1)",
      "string (poin penting 2)"
    ],
    "action_items": [
      {
        "task": "string (rincian tugas yang harus dikerjakan)",
        "assignee": "string (nama orang/PIC atau 'Belum ditentukan')",
        "deadline": "string (waktu target atau 'Segera')",
        "completed": false
      }
    ]
  }
}
`;

    const response = await ai.models.generateContent({
      model: config.GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
            {
              text: "Analisis audio rapat ini sekarang. Ekstrak transkrip percakapan, diarization pembicara, ringkasan, dan action items dalam format JSON sesuai instruksi.",
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim() || "";
    try {
      const parsedData: AIProcessedMeeting = JSON.parse(responseText);
      return parsedData;
    } catch (err) {
      console.error("Gagal parse JSON dari Gemini response:", responseText);
      throw new Error("Format respons AI tidak valid. Gagal mengekstrak transkrip rapat.");
    }
  },
};
