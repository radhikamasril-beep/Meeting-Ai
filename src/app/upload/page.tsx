"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileAudio, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || "Rekaman Unggahan");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/meeting/${data.meeting.id}`);
      } else {
        setError(data.error || "Gagal mengunggah audio");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <FileAudio className="h-6 w-6 text-indigo-400" />
          Unggah Rekaman Rapat
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Dukung format MP3, WAV, M4A, OGG, atau WebM. Gemini 3.8 Flash akan otomatis melakukan diarization dan membuat notula rapat.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Judul Rapat</label>
            <input
              type="text"
              placeholder="Contoh: Evaluasi Proyek Mingguan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Pilih File Audio</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-800 hover:border-indigo-500/60 rounded-2xl p-8 cursor-pointer bg-gray-950/40 transition-colors">
              <UploadCloud className="h-10 w-10 text-indigo-400 mb-3" />
              <p className="text-sm font-medium text-gray-200">
                {file ? file.name : "Klik atau seret file audio ke sini"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {file
                  ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                  : "Maksimal audio durasi panjang didukung"}
              </p>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/")}
            >
              Kembali
            </Button>
            <Button
              type="submit"
              disabled={!file}
              isLoading={isUploading}
              className="gap-2"
            >
              Proses Transkrip AI <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
