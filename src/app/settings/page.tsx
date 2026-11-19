"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2, Bot, Cpu, Key, Globe, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  const [aiProvider, setAiProvider] = useState("9router");
  const [routerBaseUrl, setRouterBaseUrl] = useState("http://localhost:20128/v1");
  const [routerModel, setRouterModel] = useState("ag/gemini-3.8-flash-high");
  const [routerApiKey, setRouterApiKey] = useState("");
  const [botDisplayName, setBotDisplayName] = useState("AI Meeting Note Taker");
  const [headlessBot, setHeadlessBot] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setAiProvider(data.config.AI_PROVIDER || "9router");
          setRouterBaseUrl(data.config.ROUTER_BASE_URL || "http://localhost:20128/v1");
          setRouterModel(data.config.ROUTER_MODEL || "ag/gemini-3.8-flash-high");
          setRouterApiKey(data.config.ROUTER_API_KEY || "");
          setBotDisplayName(data.config.BOT_DISPLAY_NAME || "AI Meeting Note Taker");
          setHeadlessBot(data.config.HEADLESS_BOT !== false);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          AI_PROVIDER: aiProvider,
          ROUTER_BASE_URL: routerBaseUrl,
          ROUTER_MODEL: routerModel,
          ROUTER_API_KEY: routerApiKey,
          BOT_DISPLAY_NAME: botDisplayName,
          HEADLESS_BOT: headlessBot,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(data.error || "Gagal menyimpan konfigurasi.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-indigo-400" />
          Pengaturan Bot & AI Engine
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Konfigurasi provider kecerdasan buatan, model transkripsi, serta identitas bot pertemuan.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: AI Provider & Engine */}
        <Card className="space-y-5">
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2 border-b border-gray-800 pb-3">
            <Cpu className="h-5 w-5 text-indigo-400" />
            Konfigurasi AI Provider (Speech-to-Text & Summary)
          </h3>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-2">Provider AI</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAiProvider("9router")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  aiProvider === "9router"
                    ? "border-indigo-500 bg-indigo-950/30 text-white"
                    : "border-gray-800 bg-gray-950/40 text-gray-400 hover:border-gray-700"
                }`}
              >
                <div className="font-bold text-sm">9Router (Lokal / Unlimited)</div>
                <div className="text-xs text-gray-500 mt-1">Koneksi lokal tanpa limit kuota cloud</div>
              </button>

              <button
                type="button"
                onClick={() => setAiProvider("gemini")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  aiProvider === "gemini"
                    ? "border-indigo-500 bg-indigo-950/30 text-white"
                    : "border-gray-800 bg-gray-950/40 text-gray-400 hover:border-gray-700"
                }`}
              >
                <div className="font-bold text-sm">Google Gemini Direct</div>
                <div className="text-xs text-gray-500 mt-1">Langsung via Google AI Studio API Key</div>
              </button>
            </div>
          </div>

          {aiProvider === "gemini" && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-gray-400" />
                  Google Gemini API Key (Google AI Studio)
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={routerApiKey}
                  onChange={(e) => setRouterApiKey(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Dapatkan kunci gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 underline">aistudio.google.com</a>
                </p>
              </div>
            </div>
          )}
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                  9Router Base URL
                </label>
                <input
                  type="text"
                  required
                  value={routerBaseUrl}
                  onChange={(e) => setRouterBaseUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">Model 9Router</label>
                <input
                  type="text"
                  required
                  value={routerModel}
                  onChange={(e) => setRouterModel(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-gray-400" />
                  9Router API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={routerApiKey}
                  onChange={(e) => setRouterApiKey(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Section 2: Bot Behavior */}
        <Card className="space-y-5">
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2 border-b border-gray-800 pb-3">
            <Bot className="h-5 w-5 text-indigo-400" />
            Perilaku Bot Pertemuan
          </h3>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">Nama Tampilan Bot di Meeting</label>
            <input
              type="text"
              required
              value={botDisplayName}
              onChange={(e) => setBotDisplayName(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Nama ini akan muncul sebagai peserta tamu di Google Meet / Teams.
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-800 bg-gray-950/40">
            <div>
              <div className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-400" />
                Mode Headless (Senyap di Background)
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Jika diaktifkan, jendela browser bot tidak akan muncul di layar desktop saat merekam.
              </p>
            </div>
            <input
              type="checkbox"
              checked={headlessBot}
              onChange={(e) => setHeadlessBot(e.target.checked)}
              className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-0 cursor-pointer"
            />
          </div>
        </Card>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Pengaturan berhasil disimpan dan langsung aktif!
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
