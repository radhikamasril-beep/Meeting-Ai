import { GoogleGenAI } from "@google/genai";
import { getValidatedConfig } from "../lib/config";
import { AudioService } from "./audio-service";
import { ActionItem } from "../types/meeting";

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
  // Main pipeline: Audio -> Transcripts + Diarization + Structured Summary
  async processMeetingAudio(audioFilePath: string): Promise<AIProcessedMeeting> {
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

    let responseText = "";

    // JIKA MENGGUNAKAN 9ROUTER (LOCAL UNLIMITED ROUTER)
    if (config.AI_PROVIDER === "9router") {
      console.log(`[AIService] Processing audio via 9Router at ${config.ROUTER_BASE_URL} (Model: ${config.ROUTER_MODEL})...`);
      
      const payload = {
        model: config.ROUTER_MODEL,
        messages: [
          {
            role: "system",
            content: systemInstruction,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analisis audio rapat ini sekarang. Ekstrak transkrip percakapan, diarization pembicara, ringkasan, dan action items dalam format JSON sesuai instruksi.",
              },
              {
                type: "input_audio",
                input_audio: {
                  data: base64Audio,
                  format: mimeType.includes("wav") ? "wav" : "mp3",
                },
              },
            ],
          },
        ],
        stream: false,
        temperature: 0.2,
      };

      const res = await fetch(`${config.ROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.ROUTER_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`9Router error (${res.status}): ${errBody}`);
      }

      const resJson: any = await res.json();
      responseText = resJson.choices?.[0]?.message?.content?.trim() || "";
    } else {
      // FALLBACK KE GOOGLE GEMINI API DIRECT
      console.log(`[AIService] Processing audio via Google Gemini Direct (Model: ${config.GEMINI_MODEL})...`);
      if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === "your_gemini_api_key_here") {
        throw new Error("GEMINI_API_KEY belum diisi di .env");
      }
      const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
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
      responseText = response.text?.trim() || "";
    }

    // Bersihkan markdown fence jika ada
    const cleanJson = responseText
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    try {
      const parsedData: AIProcessedMeeting = JSON.parse(cleanJson);
      return parsedData;
    } catch (err) {
      console.error("Gagal parse JSON dari AI response:", responseText);
      throw new Error("Format respons AI tidak valid. Gagal mengekstrak transkrip rapat.");
    }
  },
};
