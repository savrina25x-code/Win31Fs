/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Upload, Volume2, Music, Film, RotateCcw } from 'lucide-react';
import { sounds } from './SoundEffects';

interface PresetTrack {
  name: string;
  url: string;
  type: 'audio' | 'video';
  author: string;
}

const RETRO_PRESETS: PresetTrack[] = [
  {
    name: '8-Bit Retro Chiptune Loop (Synth)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    type: 'audio',
    author: 'Synthesizer Retro-Wave'
  },
  {
    name: 'Chiptune Arpeggio Anthem',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    type: 'audio',
    author: 'Vintage Tracker v1.2'
  },
  {
    name: 'Teaser Vintage Countdown Clip',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-futuristic-grid-tunnel-31295-large.mp4',
    type: 'video',
    author: 'Vaporwave Neon Grid'
  }
];

export default function MediaPlayer() {
  const [fileUrl, setFileUrl] = useState<string | null>(RETRO_PRESETS[0].url);
  const [fileType, setFileType] = useState<'audio' | 'video'>('audio');
  const [fileName, setFileName] = useState(RETRO_PRESETS[0].name);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [dragActive, setDragActive] = useState(false);
  const [customFileLoaded, setCustomFileLoaded] = useState(false);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync volume
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = volume;
    }
  }, [volume, fileUrl]);

  const handlePlayPause = () => {
    sounds.playTick();
    if (!mediaRef.current) return;

    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Play interrupted", err);
      });
    }
  };

  const handleStop = () => {
    sounds.playTick();
    if (!mediaRef.current) return;
    mediaRef.current.pause();
    mediaRef.current.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
  };

  const handleImportFile = (file: File) => {
    sounds.playBeep(440, 0.25, 'triangle');
    const isVideo = file.type.startsWith('video/');
    const url = URL.createObjectURL(file);
    
    // Stop preceding playback
    if (mediaRef.current) {
      mediaRef.current.pause();
    }

    setFileUrl(url);
    setFileType(isVideo ? 'video' : 'audio');
    setFileName(file.name);
    setCustomFileLoaded(true);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImportFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleTimeUpdate = () => {
    if (!mediaRef.current) return;
    const curr = mediaRef.current.currentTime;
    const dur = mediaRef.current.duration || 0;
    setCurrentTime(curr);
    setDuration(dur);
    if (dur > 0) {
      setProgress((curr / dur) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mediaRef.current || duration === 0) return;
    const percentage = parseFloat(e.target.value);
    const newTime = (percentage / 100) * duration;
    mediaRef.current.currentTime = newTime;
    setProgress(percentage);
  };

  const selectPreset = (track: PresetTrack) => {
    sounds.playTick();
    if (mediaRef.current) {
      mediaRef.current.pause();
    }
    setFileUrl(track.url);
    setFileType(track.type);
    setFileName(track.name);
    setCustomFileLoaded(false);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div id="media-player-app" className="flex flex-col h-full bg-[#C0C0C0] text-black text-xs font-sans p-2 select-none justify-between">
      
      {/* File/Device Menus */}
      <div className="flex gap-4 border-b border-gray-400 pb-1.5 mb-2 text-xs font-bold px-1 select-none items-center">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="hover:bg-gray-300 px-1 py-0.5 cursor-pointer flex items-center gap-1.5"
        >
          <Upload size={12} /> Open File...
        </button>
        <span className="text-gray-400">|</span>
        <span className="text-gray-600 font-normal truncate max-w-[200px]">Device: <strong>{fileName}</strong></span>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="video/*,audio/*" 
          className="hidden" 
          onChange={onFileInputChange}
        />
      </div>

      {/* Main player viewport box */}
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        
        {/* CRT Television frame / Visualizer container */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-gray-600 border-b-white border-r-white p-1 flex-1 flex flex-col items-center justify-center min-h-[140px] transition-colors
            ${dragActive ? 'bg-[#D1E8FF]' : 'bg-black'} rounded-sm overflow-hidden`}
        >
          {fileUrl ? (
            fileType === 'video' ? (
              <video
                ref={(el) => {
                  mediaRef.current = el;
                }}
                src={fileUrl}
                key={fileUrl}
                onTimeUpdate={handleTimeUpdate}
                onClick={handlePlayPause}
                className="w-full h-full object-contain bg-black"
                playsInline
                loop
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#11111a] text-[#00FFFF] font-mono relative">
                {/* Vintage audio waveform bounce emulator */}
                <div className="flex items-end justify-center gap-1.5 h-14 w-full max-w-[180px] mb-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => {
                    const randomHeight = isPlaying ? Math.floor(Math.random() * 45) + 5 : 4;
                    return (
                      <div 
                        key={bar} 
                        style={{ height: `${randomHeight}px` }} 
                        className="bg-[#00FF00] w-3.5 transition-all duration-150 border-t border-white"
                      />
                    );
                  })}
                </div>
                <div className="text-center font-bold text-[10px] uppercase text-[#FFFF00] max-w-[240px] truncate leading-tight">
                  {fileName}
                </div>
                <div className="text-[9px] text-[#A0A0A0] mt-1 italic font-sans">
                  {isPlaying ? '▶ RUNNING RETRO AUDIO ENGINE' : '‖ PAUSED'}
                </div>
                <audio
                  ref={(el) => {
                    mediaRef.current = el;
                  }}
                  src={fileUrl}
                  key={fileUrl}
                  onTimeUpdate={handleTimeUpdate}
                  loop
                />
              </div>
            )
          ) : (
            <div className="text-center p-4 text-gray-400 font-mono text-[10px]">
              No Media Loaded.<br />
              Drag and drop an audio or video file here or browse above.
            </div>
          )}

          {/* Drag & Drop Overlay Hint */}
          {dragActive && (
            <div className="absolute inset-0 bg-blue-600/70 text-white font-extrabold flex items-center justify-center flex-col p-4 text-center text-xs animate-bounce">
              <Upload size={32} className="mb-2" />
              <span>DROP FILE HERE TO AUTO-LOAD</span>
            </div>
          )}
        </div>

        {/* Vintage Media Controls (Play, Pause, Stop, Slider) */}
        <div className="bg-[#C0C0C0] border border-gray-400 p-2 flex flex-col gap-1.5 rounded-sm">
          
          {/* Classic track seeking timeline slider */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-gray-700">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-3 cursor-pointer accent-[#000080]"
              disabled={!fileUrl}
            />
            <span className="font-mono text-[10px] text-gray-700">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between mt-1">
            
            {/* Control buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePlayPause}
                disabled={!fileUrl}
                className={`w-8 h-7 flex items-center justify-center border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner active:bg-gray-100 disabled:opacity-50 cursor-pointer
                  ${isPlaying ? 'bg-green-100' : 'bg-[#C0C0C0]'}`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={12} className="text-[#008000]" /> : <Play size={12} className="text-[#000080]" />}
              </button>
              <button
                onClick={handleStop}
                disabled={!fileUrl}
                className="w-8 h-7 flex items-center justify-center border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner active:bg-gray-100 disabled:opacity-50 cursor-pointer"
                title="Stop"
              >
                <Square size={10} fill="#000" />
              </button>
            </div>

            {/* Volume indicator */}
            <div className="flex items-center gap-1.5">
              <Volume2 size={12} className="text-gray-700" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-14 h-2 accent-gray-700 cursor-pointer"
              />
            </div>

          </div>

        </div>

      </div>

      {/* Preset Tracks loader (Retro Windows Accessories) */}
      <div className="mt-2.5 pt-2 border-t border-gray-400">
        <span className="text-[10px] font-bold text-gray-600 mb-1 block">LOAD RETRO EXAMPLES:</span>
        <div className="grid grid-cols-3 gap-1">
          {RETRO_PRESETS.map((track, i) => (
            <button
              key={i}
              onClick={() => selectPreset(track)}
              className={`text-left p-1 bg-[#D9D9D9] border hover:bg-[#EAEAEA] cursor-pointer text-[9px] rounded-sm truncate flex items-center gap-1
                ${fileName === track.name ? 'border-[#000080] font-bold text-[#000080]' : 'border-gray-500'}`}
            >
              {track.type === 'audio' ? <Music size={9} /> : <Film size={9} />}
              <span className="truncate">{track.name}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
