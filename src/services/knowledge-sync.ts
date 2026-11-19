import fs from "node:fs";
import path from "node:path";
import { MeetingRepository } from "@/lib/db";
import { formatDuration } from "@/lib/utils";

export const KnowledgeSyncService = {
  // Generate unified knowledge base file for Antigravity AI
  syncAllMeetingsToKnowledge(): string {
    const knowledgeDir = path.resolve(process.cwd(), "knowledge");
    if (!fs.existsSync(knowledgeDir)) {
      fs.mkdirSync(knowledgeDir, { recursive: true });
    }

    const indexPath = path.join(knowledgeDir, "meetings-index.md");
    const meetings = MeetingRepository.list();

    let content = `# Basis Pengetahuan Rapat (Antigravity Knowledge Base)\n\n`;
    content += `> **Catatan Sistem**: File ini otomatis diperbarui setiap rapat selesai. Antigravity membaca file ini untuk memahami konteks pembicaraan, keputusan rapat, dan pembagian tugas tim.\n\n`;
    content += `Terakhir Diperbarui: ${new Date().toLocaleString("id-ID")}\n`;
    content += `Total Rapat Tercatat: ${meetings.length}\n\n`;
    content += `---\n\n`;

    if (meetings.length === 0) {
      content += `*Belum ada notulensi rapat yang tersimpan.*\n`;
      fs.writeFileSync(indexPath, content, "utf-8");
      return indexPath;
    }

    // Iterate each meeting and attach summary + tasks
    for (const m of meetings) {
      const details = MeetingRepository.getById(m.id);
      if (!details) continue;

      content += `## 📌 [${m.platform.toUpperCase()}] ${m.title}\n`;
      content += `- **ID Rapat**: \`${m.id}\`\n`;
      content += `- **Tanggal & Waktu**: ${new Date(m.created_at).toLocaleString("id-ID")}\n`;
      content += `- **Durasi**: ${formatDuration(m.duration_sec)}\n`;
      content += `- **Status**: ${m.status.toUpperCase()}\n`;

      if (details.summary) {
        content += `\n### 📝 Ringkasan Eksekutif:\n${details.summary.overview}\n\n`;

        if (details.summary.key_points && details.summary.key_points.length > 0) {
          content += `### 💡 Poin Utama Diskusi:\n`;
          details.summary.key_points.forEach((pt, i) => {
            content += `${i + 1}. ${pt}\n`;
          });
          content += `\n`;
        }

        if (details.summary.action_items && details.summary.action_items.length > 0) {
          content += `### ✅ Action Items (Tugas & Tanggung Jawab):\n`;
          details.summary.action_items.forEach((item) => {
            content += `- [ ] **${item.task}** | PIC: **${item.assignee || "Belum ditentukan"}** | Target: **${item.deadline || "Segera"}**\n`;
          });
          content += `\n`;
        }
      }

      if (details.transcripts && details.transcripts.length > 0) {
        const uniqueSpeakers = Array.from(new Set(details.transcripts.map((t) => t.speaker_name)));
        content += `### 👥 Peserta Terdeteksi: ${uniqueSpeakers.join(", ")}\n\n`;
      }

      content += `---\n\n`;
    }

    fs.writeFileSync(indexPath, content, "utf-8");
    console.log(`[KnowledgeSync] Synced ${meetings.length} meetings to ${indexPath}`);
    return indexPath;
  },
};
