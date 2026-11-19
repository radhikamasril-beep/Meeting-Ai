"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "./button";
import { formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  src?: string;
  currentTime?: number;
  onTimeUpdate?: (seconds: number) => void;
  className?: string;
}

export function AudioPlayer({ src, currentTime = 0, onTimeUpdate, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currTime, setCurrTime] = useState(currentTime);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1) {
      audioRef.current.currentTime = currentTime;
      setCurrTime(currentTime);
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const now = audioRef.current.currentTime;
    setCurrTime(now);
    onTimeUpdate?.(now);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
    setCurrTime(targetTime);
    onTimeUpdate?.(targetTime);
  };

  return (
    <div className={`flex flex-col gap-2 rounded-xl border border-gray-800 bg-gray-900/80 p-4 shadow-lg backdrop-blur ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center justify-between gap-4">
        {/* Play / Pause / Reset */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="primary"
            onClick={togglePlay}
            className="h-10 w-10 rounded-full"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime = 0;
            }}
            className="h-9 w-9 text-gray-400"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar & Seek */}
        <div className="flex flex-1 items-center gap-3">
          <span className="font-mono text-xs text-gray-400">{formatDuration(currTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currTime}
            onChange={handleSeek}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-700 accent-indigo-500"
          />
          <span className="font-mono text-xs text-gray-500">{formatDuration(duration)}</span>
        </div>

        {/* Mute toggle */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.muted = !isMuted;
              setIsMuted(!isMuted);
            }
          }}
          className="h-9 w-9 text-gray-400"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
