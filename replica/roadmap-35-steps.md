# Master Blueprint: 35 Langkah Replikasi Meeting.ai

Berdasarkan framework `replica-skill` (Recon -> Architect -> Design -> Backend -> Build -> Test -> Entrepreneur -> Deploy).

---

## TAHAP 1: Recon & Foundation (Langkah 1 - 5)
1. **[SELESAI] Recon Map**: Audit landing page, alur produk, struktur screen, dan sistem coin Meeting.ai (`replica/recon.md`).
2. **[SELESAI] Feature Matrix**: Klasifikasi fitur Must/Should/Could/Skip ke dalam spreadsheet (`replica/features.csv`).
3. **[SELESAI] Architecture Plan**: Menentukan tech stack lokal bebas biaya langganan (`replica/architecture.md`).
4. **Init Repository & Environment**: Setup Git, konfigurasi `.gitignore`, `.env.example`, dan struktur direktori monorepo di `D:\meetingai-replica`.
5. **Config Security & BYOK**: Setup schema validasi config untuk Gemini API Key, port server, dan direktori file rekaman lokal.

---

## TAHAP 2: Design System & Tokens (Langkah 6 - 9)
6. **Extract Color Palette & Typography**: Mengambil token warna Meeting.ai (Indigo primary, neutral slate, font sans + mono timestamp).
7. **Build Atomic UI Components**: Tombol (Button), Card, Badge, Modal, Input, Textarea, Tooltip pakai Tailwind CSS.
8. **Audio Waveform & Player Component**: Komponen audio player khusus rapat dengan visualizer waveform dan penanda timeline speaker.
9. **Responsive Layout Shell**: Sidebar navigasi, Header dengan status koneksi bot, dan breadcrumb.

---

## TAHAP 3: Database & State Management (Langkah 10 - 13)
10. **Init SQLite & Schema**: Setup database lokal `database.sqlite` menggunakan Drizzle ORM / Prisma.
11. **Migration Table Meetings**: Tabel metadata rapat (judul, platform, link, durasi, status, tanggal).
12. **Migration Table Transcripts**: Tabel per segment audio (speaker name, start time, end time, transcript text, confidence score).
13. **Migration Table Summaries & Action Items**: Tabel ringkasan eksekutif, poin bahasan per topik, dan daftar tugas (task, PIC, deadline).

---

## TAHAP 4: Core AI Engine & Speech Pipeline (Langkah 14 - 18)
14. **Audio Ingestion Service**: Handler upload file audio lokal (MP3, WAV, M4A, OGG) dengan konversi otomatis ke WAV 16kHz mono via ffmpeg.
15. **Gemini Multimodal Speech-to-Text**: Client service untuk mengirim audio buffer ke Gemini API dengan prompting khusus transkripsi rapat bahasa Indonesia + istilah teknis.
16. **Speaker Diarization Engine**: Algoritma pelabelan pembicara ("Speaker 1", "Speaker 2") berdasarkan timeline suara dan konteks percakapan.
17. **AI Summary & Action Items Generator**: Prompt engineering ekstraksi ringkasan rapat terstruktur dalam format JSON murni.
18. **Pipeline Fallback & Chunking**: Pemecah audio jika durasi rapat panjang (> 1 jam) agar tidak membebani batas context window dan memori.

---

## TAHAP 5: Autonomous Meeting Bot (Playwright) (Langkah 19 - 24)
19. **Setup Headless Browser Service**: Instalasi Playwright Chromium dengan fake media stream flags dan permission bypass.
20. **Google Meet Navigator**: Automasi navigasi ke link Google Meet, mengisi nama bot ("AI Note Taker"), auto-mute mikrofon, dan matikan kamera.
21. **Join Meeting Handler**: Deteksi tombol "Minta bergabung" (Ask to Join) atau "Gabung sekarang" (Join now), menangani waiting room host.
22. **In-Meeting Audio Capture**: Script loopback menangkap stream output audio dari tab meeting ke buffer PCM/WAV real-time.
23. **Meeting End Detector**: Deteksi otomatis ketika rapat selesai (misal semua peserta keluar atau tombol leave ditekan) lalu trigger finalisasi transkripsi.
24. **Bot Process Manager**: Worker background untuk mengelola lifecycle bot (spawn, monitor, kill zombie process).

---

## TAHAP 6: Frontend Pages & Feature Build (Langkah 25 - 29)
25. **Dashboard Screen (S01)**: Halaman utama daftar rekaman rapat, pencarian berdasarkan judul/isi percakapan, dan tombol "New Meeting".
26. **Quick Join Modal**: Form input link Google Meet untuk meluncurkan bot langsung dari UI.
27. **Offline Audio Upload Screen (S04)**: Drag-and-drop file rekaman dengan live progress bar upload dan transkripsi.
28. **Live Recording Status Screen (S02)**: Layar pemantau saat rapat sedang berlangsung (status bot di dalam room).
29. **Meeting Detail & Summary Screen (S03)**:
    - Tab 1: Ringkasan Eksekutif & Key Takeaways.
    - Tab 2: Action Items dengan checkbox interaktif (tugas, nama PIC, target waktu).
    - Tab 3: Transkrip lengkap berlabel pembicara yang tersinkronisasi dengan audio player (klik teks = audio loncat ke menit tersebut).

---

## TAHAP 7: Interactivity, Editing & Export (Langkah 30 - 32)
30. **Transcript In-Place Editor**: Fitur edit teks transkrip dan ubah nama pembicara jika AI salah mendeteksi.
31. **Export Engine**: Export hasil rapat ke format Markdown (`.md`), Plain Text (`.txt`), dan PDF.
32. **Copy to Clipboard Shortcuts**: Tombol 1-klik salin ringkasan ke WhatsApp / Slack / Email template.

---

## TAHAP 8: Testing, Entrepreneur Advantage & Polish (Langkah 33 - 35)
33. **End-to-End Stress Test**: Uji coba rekam audio meeting 10 menit, cek sinkronisasi audio vs teks, dan verifikasi ekstraksi action items.
34. **The Entrepreneur Edge (Kelebihan dibanding Meeting.ai asli)**:
    - **No Coin Paywall**: Bebas pakai tanpa batasan koin mingguan/bulanan.
    - **100% Data Privacy**: Audio dan transkrip tersimpan lokal di laptop user (`D:\meetingai-replica`), tidak di-host di server publik pihak ketiga.
    - **Unlimited Model Freedom**: Bisa ganti engine (Gemini Flash, Whisper Lokal, atau model custom).
35. **Launcher Script**: Pembuatan script 1-klik `start-meetingai.bat` untuk menjalankan seluruh sistem secara otomatis dari desktop.
