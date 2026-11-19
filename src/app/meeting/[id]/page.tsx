"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Calendar,
  CheckSquare,
  FileText,
  ArrowLeft,
  RefreshCw,
  StopCircle,
  Download,
  Copy,
  Check,
  Edit2,
  Save,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { AudioPlayer } from "@/components/ui/audio-player";
import { formatDuration, formatTimestamp } from "@/lib/utils";
import { MeetingWithDetails } from "@/types/meeting";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "actions">("summary");
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [isStoppingBot, setIsStoppingBot] = useState(false);
  const [copied, setCopied] = useState(false);

  // In-place edit state for transcripts
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSpeaker, setEditSpeaker] = useState("");
  const [editText, setEditText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setMeeting(data.meeting);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeeting();
    const interval = setInterval(() => {
      if (meeting?.status === "processing" || meeting?.status === "recording") {
        fetchMeeting();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [params.id, meeting?.status]);

  const handleStopBot = async () => {
    if (!meeting) return;
    setIsStoppingBot(true);
    try {
      await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", meetingId: meeting.id }),
      });
      fetchMeeting();
    } catch (err) {
      console.error(err);
    } finally {
      setIsStoppingBot(false);
    }
  };

  const handleCopySummary = () => {
    if (!meeting || !meeting.summary) return;
    let text = `*Notulensi Rapat: ${meeting.title}*\n\n`;
    text += `*Ringkasan:*\n${meeting.summary.overview}\n\n`;
    if (meeting.summary.action_items?.length) {
      text += `*Action Items:*\n`;
      meeting.summary.action_items.forEach((item, i) => {
        text += `${i + 1}. ${item.task} (PIC: ${item.assignee || "-"} | Deadline: ${item.deadline || "-"})\n`;
      });
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEdit = (t: any) => {
    setEditingId(t.id);
    setEditSpeaker(t.speaker_name);
    setEditText(t.text);
  };

  const saveEdit = async (transcriptId: string) => {
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/meetings/${params.id}/transcripts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcriptId,
          speaker_name: editSpeaker,
          text: editText,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchMeeting();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (!meeting) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">{meeting.title}</h2>
              <Badge
                variant={
                  meeting.status === "completed"
                    ? "success"
                    : meeting.status === "recording"
                    ? "danger"
                    : "warning"
                }
              >
                {meeting.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(meeting.created_at).toLocaleDateString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(meeting.duration_sec)}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {meeting.status === "recording" && (
            <Button
              variant="danger"
              isLoading={isStoppingBot}
              onClick={handleStopBot}
              className="gap-2"
            >
              <StopCircle className="h-4 w-4" />
              Selesaikan Rapat
            </Button>
          )}

          {meeting.status === "completed" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySummary}
                className="gap-1.5"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Tersalin!" : "Salin ke WA/Slack"}
              </Button>

              <a href={`/api/meetings/${meeting.id}/export?format=markdown`} download>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Unduh .MD
                </Button>
              </a>

              <a href={`/api/meetings/${meeting.id}/export?format=txt`} download>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <FileText className="h-4 w-4" />
                  Unduh .TXT
                </Button>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {meeting.audio_path && (
        <AudioPlayer
          currentTime={currentAudioTime}
          onTimeUpdate={(t) => setCurrentAudioTime(t)}
        />
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "summary"
              ? "border-indigo-500 text-white"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <FileText className="h-4 w-4" />
          Ringkasan Eksekutif
        </button>
        <button
          onClick={() => setActiveTab("transcript")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "transcript"
              ? "border-indigo-500 text-white"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          Transkrip & Edit ({meeting.transcripts.length})
        </button>
        <button
          onClick={() => setActiveTab("actions")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "actions"
              ? "border-indigo-500 text-white"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          Action Items ({meeting.summary?.action_items?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-3">
              Ikhtisar Rapat
            </h3>
            <p className="text-sm leading-relaxed text-gray-200">
              {meeting.summary?.overview || "Ringkasan rapat sedang diproses atau belum tersedia..."}
            </p>
          </Card>

          {meeting.summary?.key_points && meeting.summary.key_points.length > 0 && (
            <Card>
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-3">
                Poin-Poin Utama Diskusi
              </h3>
              <ul className="space-y-2">
                {meeting.summary.key_points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-950 text-indigo-400 text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {activeTab === "transcript" && (
        <div className="space-y-3">
          {meeting.transcripts.map((t) => (
            <div
              key={t.id}
              className="group p-4 rounded-xl border border-gray-800/80 bg-gray-950/40 hover:bg-gray-900/60 hover:border-indigo-500/40 transition-all"
            >
              {editingId === t.id ? (
                /* In-place Edit Form */
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={editSpeaker}
                      onChange={(e) => setEditSpeaker(e.target.value)}
                      placeholder="Nama Pembicara"
                      className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1 text-xs text-indigo-300 font-bold focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="font-mono text-xs text-gray-500">
                      {formatTimestamp(t.start_ms)}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      isLoading={isSavingEdit}
                      onClick={() => saveEdit(t.id)}
                      className="gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Simpan
                    </Button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div
                  onClick={() => setCurrentAudioTime(t.start_ms / 1000)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-indigo-400">{t.speaker_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-gray-500 group-hover:text-indigo-400">
                        {formatTimestamp(t.start_ms)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(t);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-400 text-gray-500 transition-opacity"
                        title="Koreksi transkrip / pembicara"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">{t.text}</p>
                </div>
              )}
            </div>
          ))}

          {meeting.transcripts.length === 0 && (
            <p className="text-center py-12 text-sm text-gray-500">
              Belum ada transkrip audio yang diproses.
            </p>
          )}
        </div>
      )}

      {activeTab === "actions" && (
        <Card>
          <div className="space-y-3">
            {meeting.summary?.action_items?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-800/60 bg-gray-900/40"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-0 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-200">{item.task}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      PIC: <strong className="text-indigo-300">{item.assignee || "Belum ditentukan"}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Target: <strong className="text-amber-300">{item.deadline || "Segera"}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {(!meeting.summary?.action_items || meeting.summary.action_items.length === 0) && (
              <p className="text-center py-8 text-sm text-gray-500">
                Tidak ada action item spesifik yang terdeteksi dari rapat ini.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
