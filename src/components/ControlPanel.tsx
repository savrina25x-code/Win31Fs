/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { THEME_SCHEMES, ThemeScheme } from '../types';
import { sounds } from './SoundEffects';
import { Volume2, VolumeX, Monitor, Palette } from 'lucide-react';

interface ControlPanelProps {
  currentScheme: ThemeScheme;
  onSchemeChange: (scheme: ThemeScheme) => void;
  backgroundPattern: string;
  onBackgroundPatternChange: (pattern: string) => void;
}

export default function ControlPanel({
  currentScheme,
  onSchemeChange,
  backgroundPattern,
  onBackgroundPatternChange,
}: ControlPanelProps) {
  const [isMuted, setIsMuted] = useState(sounds.getMutedState());

  const handleToggleMute = () => {
    const newMuted = sounds.toggleMute();
    setIsMuted(newMuted);
    if (!newMuted) {
      sounds.playBeep(440, 0.25, 'triangle');
    }
  };

  const handleSelectScheme = (scheme: ThemeScheme) => {
    sounds.playBeep(523.25, 0.1, 'sine');
    onSchemeChange(scheme);
  };

  const handleSelectPattern = (pattern: string) => {
    sounds.playBeep(587.33, 0.1, 'sine');
    onBackgroundPatternChange(pattern);
  };

  return (
    <div id="control-panel-app" className="flex flex-col h-full bg-[#C0C0C0] text-black text-xs font-sans p-3 select-none justify-between">
      
      {/* Scrollable interior */}
      <div className="flex-1 overflow-auto flex flex-col gap-4">
        
        {/* Color schemes */}
        <div className="border hover:border-gray-500 rounded-sm p-2 bg-[#D1D1D1] border-gray-400">
          <div className="flex items-center gap-1.5 font-bold mb-2">
            <Palette size={14} className="text-gray-700" />
            <span>Windows Color Schemes</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {(Object.keys(THEME_SCHEMES) as ThemeScheme[]).map((schemeKey) => {
              const theme = THEME_SCHEMES[schemeKey];
              return (
                <button
                  key={schemeKey}
                  onClick={() => handleSelectScheme(schemeKey)}
                  className={`w-full text-left px-2 py-1.5 border border-transparent rounded-sm flex items-center justify-between hover:bg-gray-200 cursor-pointer
                    ${currentScheme === schemeKey ? 'bg-white border-blue-600 font-bold' : 'bg-[#C0C0C0]'}`}
                >
                  <span>{theme.name}</span>
                  <div className="flex gap-1">
                    <div className="w-3.5 h-3.5 border border-black" style={{ backgroundColor: theme.desktopBg }} title="Desktop" />
                    <div className="w-3.5 h-3.5 border border-black" style={{ backgroundColor: theme.buttonFace }} title="Dialog" />
                    <div className="w-3.5 h-3.5 border border-black" style={{ backgroundColor: theme.titleActiveBg }} title="Active Bar" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wallpaper background pattern */}
        <div className="border hover:border-gray-500 rounded-sm p-2 bg-[#D1D1D1] border-gray-400">
          <div className="flex items-center gap-1.5 font-bold mb-2">
            <Monitor size={14} className="text-gray-700" />
            <span>Desktop Background Pattern</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'none', label: 'Solid Solid' },
              { id: 'checkers', label: 'Dither Dot grid' },
              { id: 'waves', label: 'Vintage Mesh' },
              { id: 'slate', label: 'Coarse Maze' },
            ].map((pat) => (
              <button
                key={pat.id}
                onClick={() => handleSelectPattern(pat.id)}
                className={`px-3 py-1.5 border rounded-sm hover:bg-gray-200 cursor-pointer text-[10px] uppercase font-bold
                  ${backgroundPattern === pat.id ? 'bg-white border-blue-600 font-black' : 'bg-[#C0C0C0] border-gray-400'}`}
              >
                {pat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audio settings */}
        <div className="border hover:border-gray-500 rounded-sm p-2 bg-[#D1D1D1] border-gray-400">
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center gap-1.5">
              {isMuted ? <VolumeX size={14} className="text-[#FF0000]" /> : <Volume2 size={14} className="text-[#008000]" />}
              <span>PC Speaker Audio Beeps</span>
            </div>
            
            <button
              onClick={handleToggleMute}
              className={`px-3 py-1 border-2 text-[10px] font-bold uppercase rounded-sm cursor-pointer border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner
                ${isMuted ? 'bg-[#FFD1D1] text-red-700' : 'bg-green-100 text-green-700'}`}
            >
              {isMuted ? 'Muted' : 'Sound ON'}
            </button>
          </div>
          <div className="text-[9px] text-gray-500 mt-1">
            Controls retroactive sound events such as arpeggios, Minesweeper grid ticking, clicks, wins and loading beeps.
          </div>
        </div>

      </div>

      {/* Control panel footer */}
      <div className="pt-2 border-t border-gray-400 text-center text-[10px] text-gray-700 font-medium select-none">
        Control Panel v3.1 | Core Configuration Unit
      </div>

    </div>
  );
}
