import React from "react";
import Link from "next/link";
import { Mic, FileAudio, Settings, Bot, Sparkles, CheckCircle2 } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-20 flex h-full w-64 flex-col border-r border-gray-800 bg-gray-950/70 p-4 backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-md">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            Meeting.ai <span className="text-[10px] font-semibold bg-indigo-900/50 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-700/50">BYOK</span>
          </h1>
          <p className="text-xs text-gray-500">Autonomous Note Taker</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex flex-1 flex-col gap-1">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-medium text-white transition-colors"
        >
          <Mic className="h-4 w-4 text-indigo-400" />
          Semua Rapat
        </Link>
        <Link
          href="/upload"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-900/60 hover:text-white transition-colors"
        >
          <FileAudio className="h-4 w-4" />
          Unggah Rekaman
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-900/60 hover:text-white transition-colors"
        >
          <Settings className="h-4 w-4" />
          Pengaturan Bot
        </Link>
      </nav>

      {/* BYOK Edge Banner */}
      <div className="mt-auto rounded-xl border border-indigo-950 bg-indigo-950/30 p-3.5">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
          <Sparkles className="h-4 w-4" />
          Bebas Batas Koin
        </div>
        <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
          Semua rekaman dan audio diproses lokal & langsung lewat Gemini API. Tanpa biaya langganan bulanan.
        </p>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" /> Data aman di drive lokal
        </div>
      </div>
    </aside>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-gray-800 bg-gray-950/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium text-gray-400">Bot Engine: Siap Merekam</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900 px-3 py-1 text-xs text-gray-300">
          <span className="text-gray-500">Model:</span>
          <span className="font-semibold text-indigo-400">Gemini 2.5 Flash</span>
        </div>
      </div>
    </header>
  );
}
