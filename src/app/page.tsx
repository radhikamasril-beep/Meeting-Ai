"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Calendar, Clock, Video, FileAudio, ExternalLink, Bot, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";
import { Meeting } from "@/types/meeting";

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState("");
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [gmeetUrl, setGmeetUrl] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [category, setCategory] = useState("Umum");
  const [isStartingBot, setIsStartingBot] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);

  const fetchMeetings = async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/meetings", { signal });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setMeetings(data.meetings);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Fetch meetings error:", err);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchMeetings(controller.signal);
    const interval = setInterval(() => fetchMeetings(controller.signal), 4000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isBotModalOpen) {
        setIsBotModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBotModalOpen]);

  const handleStartBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBotError(null);

    const trimmedUrl = gmeetUrl.trim();
    if (!trimmedUrl.startsWith("https://meet.google.com/")) {
      setBotError("URL harus berupa link valid https://meet.google.com/xxx-xxxx-xxx");
      return;
    }

    setIsStartingBot(true);
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          meetingUrl: trimmedUrl,
          title: meetingTitle.trim() || "Rapat Google Meet",
          category: category.trim() || "Umum",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsBotModalOpen(false);
        setGmeetUrl("");
        setMeetingTitle("");
        setCategory("Umum");
        fetchMeetings();
      } else {
        setBotError(data.error || "Gagal meluncurkan bot.");
      }
    } catch (err: any) {
      setBotError(err.message || "Gagal menghubungkan ke server.");
    } finally {
      setIsStartingBot(false);
    }
  };

  const filteredMeetings = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.category && m.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Semua Rapat & Transkrip
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Rekam rapat langsung atau unggah audio untuk transkrip otomatis dan ringkasan tugas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/upload">
            <Button variant="secondary" className="gap-2">
              <FileAudio className="h-4 w-4" />
              Unggah Rekaman
            </Button>
          </Link>
          <Button onClick={() => setIsBotModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Kirim Bot ke GMeet
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Cari rapat berdasarkan judul atau organisasi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-800 bg-gray-900/60 pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 backdrop-blur focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Meetings List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMeetings.map((m) => (
          <Link key={m.id} href={`/meeting/${m.id}`}>
            <Card className="hover:border-indigo-500/50 hover:bg-gray-900/80 cursor-pointer h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        m.status === "completed"
                          ? "success"
                          : m.status === "recording"
                          ? "danger"
                          : m.status === "processing"
                          ? "warning"
                          : "default"
                      }
                    >
                      {m.status === "completed"
                        ? "Selesai"
                        : m.status === "recording"
                        ? "🔴 Merekam"
                        : m.status === "processing"
                        ? "Memproses AI..."
                        : "Menunggu"}
                    </Badge>
                    <span className="text-[11px] font-semibold bg-gray-800/80 text-gray-300 px-2 py-0.5 rounded border border-gray-700">
                      {m.category || "Umum"}
                    </span>
                  </div>

                  <span className="text-xs text-gray-500 flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(m.duration_sec)}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-100 line-clamp-1 text-base">{m.title}</h3>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(m.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  {m.platform === "gmeet" ? (
                    <Video className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <FileAudio className="h-3.5 w-3.5 text-indigo-400" />
                  )}
                  {m.platform.toUpperCase()}
                </span>
                <span className="text-indigo-400 font-medium flex items-center gap-1">
                  Lihat Notula <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </Card>
          </Link>
        ))}

        {filteredMeetings.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-950/40">
            <Bot className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400">Belum ada rapat yang tersimpan</p>
            <p className="text-xs text-gray-600 mt-1">
              Kirim bot ke Google Meet atau unggah file rekaman untuk memulai notulensi otomatis.
            </p>
          </div>
        )}
      </div>

      {/* Quick Join Modal */}
      {isBotModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-400" />
              Kirim Bot ke Google Meet
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Bot otonom akan masuk ke ruangan rapat, mematikan mic/cam, dan merekam audio untuk transkrip AI.
            </p>

            {botError && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{botError}</span>
              </div>
            )}

            <form onSubmit={handleStartBot} className="mt-5 space-y-4">
              <div>
                <label htmlFor="modal-title" className="text-xs font-medium text-gray-300 block mb-1.5">
                  Judul Rapat
                </label>
                <input
                  id="modal-title"
                  type="text"
                  placeholder="Contoh: Evaluasi Proyek Q1"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-cat" className="text-xs font-medium text-gray-300 block mb-1.5">
                  Organisasi / Kategori
                </label>
                <input
                  id="modal-cat"
                  type="text"
                  placeholder="Contoh: FOSI, Kabinet, UKM, atau Umum"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-url" className="text-xs font-medium text-gray-300 block mb-1.5">
                  Link Google Meet
                </label>
                <input
                  id="modal-url"
                  type="url"
                  required
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={gmeetUrl}
                  onChange={(e) => setGmeetUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsBotModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" isLoading={isStartingBot}>
                  Luncurkan Bot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
