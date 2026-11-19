# Meeting.ai Clone (BYOK Autonomous Note Taker)

<div align="center">
  <h3>Clone Otonom Meeting.ai: Bot Google Meet, Transkripsi Multi-Speaker & Ringkasan Rapat AI</h3>
  <p><strong>100% Data Tersimpan Lokal di Drive Anda • Tanpa Batasan Koin Bulanan</strong></p>
</div>

---

## 🌟 Keunggulan Dibanding Meeting.ai Asli (Entrepreneur Advantage)
1. **Bebas Paywall & Koin**: Meeting.ai membatasi transkrip dengan koin mingguan/bulanan (`375 s.d. 5000 koin`). Clone ini menggunakan sistem **BYOK (Bring Your Own Key)** langsung ke Google Gemini API — gratis dan bebas kuota langganan.
2. **Privasi Penuh (Local First)**: File rekaman audio mentah dan transkrip tersimpan di harddisk Anda (`data/recordings` & `data/db/meetingai.sqlite`), bukan di cloud server pihak ketiga.
3. **Didukung Gemini 3.8 Flash**: Akurasi tinggi memahami percakapan Bahasa Indonesia yang campur istilah Bahasa Inggris (*code-switching*).
4. **Autonomous Google Meet Bot**: Bot Playwright otomatis masuk ke link Google Meet, mematikan mic & kamera, merekam suara meeting, dan keluar saat rapat bubar.

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Masukkan Gemini API Key
Buka file `.env` di folder utama, lalu isi API Key Anda:
```env
GEMINI_API_KEY=AIzaSy...
```
*(Dapatkan gratis tanpa kartu kredit di: https://aistudio.google.com/app/apikey)*

### 2. Jalankan Server (1-Klik)
Cukup double-click file:
```
D:\meetingai-replica\start-meetingai.bat
```
Atau jalankan via terminal:
```bash
npm run dev
```
Buka browser di **`http://localhost:3000`**.

---

## 🛠️ Fitur Utama
- **Kirim Bot ke Google Meet**: Cukup masukkan tautan `https://meet.google.com/xxx-xxxx-xxx`.
- **Unggah Rekaman Offline**: Drag-and-drop file audio `.mp3`, `.wav`, `.m4a`, `.ogg`.
- **Pemain Audio Interaktif**: Klik teks transkrip untuk melompatkan audio ke detik spesifik.
- **In-Place Transcript Editor**: Koreksi nama pembicara dan kalimat jika ada istilah teknis unik.
- **Ekspor Cepat**: 1-klik unduh dokumen format Markdown (`.md`), Plain Text (`.txt`), atau salin langsung format pesan WhatsApp / Slack.

---

## 📁 Struktur Direktori
- `src/services/bot-service.ts`: Engine Playwright headless browser automation.
- `src/services/ai-service.ts`: Pipeline Gemini 3.8 Flash multimodal audio STT & diarization.
- `src/lib/db.ts`: SQLite native Node.js 24 database engine.
- `src/components/ui/`: Atomic design system & audio visualizer player.
- `replica/`: Dokumentasi recon, arsitektur, dan matriks fitur clean-room.
