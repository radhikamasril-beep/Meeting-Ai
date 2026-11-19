import fs from "node:fs";
import path from "node:path";
import { MeetingRepository } from "@/lib/db";
import { formatDuration } from "@/lib/utils";

function sanitizeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "umum";
}

export const KnowledgeSyncService = {
  // Sync a single meeting to its dedicated category folder
  syncMeeting(meetingId: string): void {
    const details = MeetingRepository.getById(meetingId);
    if (!details) return;

    const category = details.category || "Umum";
    const categorySlug = sanitizeSlug(category);

    const baseDir = path.resolve(process.cwd(), "knowledge");
    const categoryDir = path.join(baseDir, "categories", categorySlug);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    const meetingSlug = sanitizeSlug(details.title);
    const datePrefix = new Date(details.created_at).toISOString().split("T")[0];
    const fileName = `${datePrefix}_${details.id}_${meetingSlug}.md`;
    const filePath = path.join(categoryDir, fileName);

    let doc = `# ${details.title}\n\n`;
    doc += `- **Kategori/Organisasi**: ${category}\n`;
    doc += `- **ID Rapat**: \`${details.id}\`\n`;
    doc += `- **Platform**: ${details.platform.toUpperCase()}\n`;
    doc += `- **Tanggal**: ${new Date(details.created_at).toLocaleString("id-ID")}\n`;
    doc += `- **Durasi**: ${formatDuration(details.duration_sec)}\n\n`;

    if (details.summary) {
      doc += `## 📝 Ringkasan Eksekutif\n${details.summary.overview}\n\n`;

      if (details.summary.key_points && details.summary.key_points.length > 0) {
        doc += `## 💡 Poin Utama Diskusi\n`;
        details.summary.key_points.forEach((pt, i) => {
          doc += `${i + 1}. ${pt}\n`;
        });
        doc += `\n`;
      }

      if (details.summary.action_items && details.summary.action_items.length > 0) {
        doc += `## ✅ Action Items (Tugas & Tanggung Jawab)\n`;
        details.summary.action_items.forEach((item) => {
          doc += `- [ ] **${item.task}** | PIC: **${item.assignee || "Belum ditentukan"}** | Target: **${item.deadline || "Segera"}**\n`;
        });
        doc += `\n`;
      }
    }

    if (details.transcripts && details.transcripts.length > 0) {
      const uniqueSpeakers = Array.from(new Set(details.transcripts.map((t) => t.speaker_name)));
      doc += `## 👥 Peserta Terdeteksi\n${uniqueSpeakers.join(", ")}\n\n`;

      doc += `## 📜 Transkrip Rapat (Telah Diverifikasi/Diedit)\n`;
      details.transcripts.forEach((t) => {
        doc += `**${t.speaker_name}**: ${t.text}\n\n`;
      });
    }

    fs.writeFileSync(filePath, doc, "utf-8");
    console.log(`[KnowledgeSync] Meeting synced to ${filePath}`);

    // Update global lightweight index
    this.updateGlobalIndex();
  },

  // Update lightweight index JSON for fast routing
  updateGlobalIndex(): void {
    const baseDir = path.resolve(process.cwd(), "knowledge");
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    const meetings = MeetingRepository.list();
    const indexData = meetings.map((m) => ({
      id: m.id,
      title: m.title,
      category: m.category || "Umum",
      categorySlug: sanitizeSlug(m.category || "Umum"),
      date: m.created_at,
      status: m.status,
    }));

    fs.writeFileSync(path.join(baseDir, "index.json"), JSON.stringify(indexData, null, 2), "utf-8");
  },

  // Sync all meetings
  syncAllMeetingsToKnowledge(): void {
    const meetings = MeetingRepository.list();
    for (const m of meetings) {
      this.syncMeeting(m.id);
    }
  },
};
