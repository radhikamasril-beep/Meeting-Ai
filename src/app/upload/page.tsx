"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileAudio, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ALLOWED_EXT = [".mp3", ".wav", ".m4a", ".ogg", ".webm", ".aac"];
const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Umum");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processSelectedFile = (selected: File) => {
    setError(null);
    const ext = "." + selected.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setError(`Format '${ext}' tidak didukung. Harap pilih MP3, WAV, M4A, OGG, atau WebM.`);
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError("Ukuran audio melebihi batas maksimum 200MB.");
      return;
    }

    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
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
      formData.append("title", title.trim() || "Rekaman Unggahan");
      formData.append("category", category.trim() || "Umum");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Upload gagal dengan kode status ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        router.push(`/meeting/${data.meeting.id}`);
      } else {
        setError(data.error || "Gagal mengunggah audio");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat unggah audio.");
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
            <label htmlFor="upl-title" className="text-sm font-medium text-gray-300 block mb-2">
              Judul Rapat
            </label>
            <input
              id="upl-title"
              type="text"
              placeholder="Contoh: Evaluasi Proyek Mingguan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="upl-cat" className="text-sm font-medium text-gray-300 block mb-2">
              Organisasi / Kategori
            </label>
            <input
              id="upl-cat"
              type="text"
              placeholder="Contoh: FOSI, Kabinet, UKM Badminton, atau Umum"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Pilih File Audio</label>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors ${
                isDragging
                  ? "border-indigo-400 bg-indigo-950/20"
                  : "border-gray-800 hover:border-indigo-500/60 bg-gray-950/40"
              }`}
            >
              <UploadCloud className="h-10 w-10 text-indigo-400 mb-3" />
              <p className="text-sm font-medium text-gray-200">
                {file ? file.name : "Klik atau seret file audio ke sini"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {file
                  ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                  : "Maksimal audio 200MB didukung"}
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
