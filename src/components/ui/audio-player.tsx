"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "./button";
import { formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  src?: string;
  seekTarget?: number | null;
  className?: string;
}

export function AudioPlayer({ src, seekTarget = null, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currTime, setCurrTime] = useState(0);
  const [sliderVal, setSliderVal] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Jump to specific time from transcript click without triggering circular loop
  useEffect(() => {
    if (seekTarget !== null && audioRef.current) {
      audioRef.current.currentTime = seekTarget;
      setCurrTime(seekTarget);
      setSliderVal(seekTarget);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [seekTarget]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Audio playback error:", err);
          }
        });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || isSeeking) return;
    const now = audioRef.current.currentTime;
    setCurrTime(now);
    setSliderVal(now);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
    setHasError(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSeeking(true);
    setSliderVal(Number(e.target.value));
  };

  const handleCommitSeek = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    const target = Number((e.target as HTMLInputElement).value);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
      setCurrTime(target);
    }
    setIsSeeking(false);
  };

  return (
    <div className={`flex flex-col gap-2 rounded-xl border border-gray-800 bg-gray-900/80 p-4 shadow-lg backdrop-blur ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => setHasError(true)}
        onEnded={() => setIsPlaying(false)}
      />

      {hasError ? (
        <div className="text-xs text-amber-400 p-2 rounded bg-amber-950/40 border border-amber-800/40">
          File audio belum tersedia atau format sedang diproses.
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          {/* Play / Pause / Reset */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="primary"
              aria-label={isPlaying ? "Jeda audio" : "Putar audio"}
              onClick={togglePlay}
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Ulang audio dari awal"
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime = 0;
                setCurrTime(0);
                setSliderVal(0);
              }}
              className="h-9 w-9 text-gray-400"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Smooth Seek Slider */}
          <div className="flex flex-1 items-center gap-3">
            <span className="font-mono text-xs text-gray-400">{formatDuration(isSeeking ? sliderVal : currTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={isSeeking ? sliderVal : currTime}
              onChange={handleSliderChange}
              onMouseUp={handleCommitSeek}
              onTouchEnd={handleCommitSeek}
              aria-label="Navigasi waktu audio rapat"
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-700 accent-indigo-500"
            />
            <span className="font-mono text-xs text-gray-500">{formatDuration(duration)}</span>
          </div>

          {/* Mute toggle */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={isMuted ? "Bunyikan suara" : "Bisukan suara"}
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
      )}
    </div>
  );
}
