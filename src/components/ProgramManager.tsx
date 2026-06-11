/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppId } from '../types';
import { sounds } from './SoundEffects';

interface ProgramManagerProps {
  onOpenApp: (id: AppId) => void;
  openAppMap: Record<AppId, boolean>;
}

export default function ProgramManager({ onOpenApp, openAppMap }: ProgramManagerProps) {
  const [activeGroup, setActiveGroup] = useState<'all' | 'main' | 'toys'>('all');

  const apps = [
    {
      id: 'cpanel' as AppId,
      name: 'Control Panel',
      group: 'main',
      iconUrl: '🎨',
      desc: 'Customize colors & audio speaker settings.',
    },
    {
      id: 'media' as AppId,
      name: 'Media Player',
      group: 'main',
      iconUrl: '🎬',
      desc: 'Play custom audio/video or chiptune tracks.',
    },
    {
      id: 'notepad' as AppId,
      name: 'Notepad Text',
      group: 'main',
      iconUrl: '🗒️',
      desc: 'Read mock documentation and write draft TXT notes.',
    },
    {
      id: 'minesweeper' as AppId,
      name: 'Minesweeper',
      group: 'toys',
      iconUrl: '💣',
      desc: 'Classic VGA 9x9 or 16x16 sound-assisted logic grid.',
    },
    {
      id: 'paintbrush' as AppId,
      name: 'Paintbrush',
      group: 'toys',
      iconUrl: '🖌️',
      desc: '16-color VGA brush drawing, shapes and eraser.',
    },
    {
      id: 'calculator' as AppId,
      name: 'Calculator',
      group: 'toys',
      iconUrl: '🧮',
      desc: 'Floating-point math calculator with RAM M-registers.',
    },
    {
      id: 'clock' as AppId,
      name: 'Clock App',
      group: 'toys',
      iconUrl: '⏰',
      desc: 'Live mechanical analog clock face & digital LCD panel.',
    }
  ];

  const handleLaunchApp = (id: AppId) => {
    sounds.playBeep(659.25, 0.12, 'square');
    onOpenApp(id);
  };

  const filteredApps = apps.filter((app) => {
    if (activeGroup === 'all') return true;
    return app.group === activeGroup;
  });

  return (
    <div id="progman-app" className="flex flex-col h-full bg-[#C0C0C0] text-black text-xs font-sans select-none">
      
      {/* Top Menu standard bar */}
      <div className="flex gap-4 border-b border-gray-400 pb-1 mb-2 text-[11px] font-bold p-2">
        <span className="hover:underline cursor-pointer">File</span>
        <span className="hover:underline cursor-pointer">Options</span>
        <span className="hover:underline cursor-pointer">Window</span>
        <span className="hover:underline cursor-pointer">Help</span>
      </div>

      <div className="flex-1 p-2 flex flex-col gap-3.5 min-h-0 bg-[#E1E1E1] border border-gray-400 m-2">
        
        {/* Directory-like buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => { sounds.playTick(); setActiveGroup('all'); }}
            className={`px-3 py-1 border-2 font-bold text-[10px] rounded-sm cursor-pointer border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner
              ${activeGroup === 'all' ? 'bg-[#D2D2D2] border-inner' : 'bg-[#C0C0C0]'}`}
          >
            Show All Apps
          </button>
          <button
            onClick={() => { sounds.playTick(); setActiveGroup('main'); }}
            className={`px-3 py-1 border-2 font-bold text-[10px] rounded-sm cursor-pointer border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner
              ${activeGroup === 'main' ? 'bg-[#D2D2D2] border-inner' : 'bg-[#C0C0C0]'}`}
          >
            📂 Main System
          </button>
          <button
            onClick={() => { sounds.playTick(); setActiveGroup('toys'); }}
            className={`px-3 py-1 border-2 font-bold text-[10px] rounded-sm cursor-pointer border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner
              ${activeGroup === 'toys' ? 'bg-[#D2D2D2] border-inner' : 'bg-[#C0C0C0]'}`}
          >
            📂 Accessories & Games
          </button>
        </div>

        {/* Group list panels (Beveled Boxes) */}
        <div className="flex-1 bg-white border-2 border-gray-600 border-b-white border-r-white overflow-auto p-3">
          <div className="grid grid-cols-3 gap-y-5 gap-x-4">
            {filteredApps.map((app) => {
              const isAlreadyOpen = openAppMap[app.id];
              return (
                <div
                  key={app.id}
                  onDoubleClick={() => handleLaunchApp(app.id)}
                  onClick={() => sounds.playTick()}
                  onTouchEnd={() => handleLaunchApp(app.id)}
                  className="flex flex-col items-center text-center cursor-pointer group rounded-sm p-1 hover:bg-[#000080]/10"
                >
                  {/* Styled Retro Icon Circle */}
                  <div className="w-12 h-12 flex items-center justify-center text-3xl bg-[#D6D6D6] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 group-hover:scale-105 group-active:border-inner group-active:bg-gray-300 transition-transform relative">
                    <span>{app.iconUrl}</span>
                    {isAlreadyOpen && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-600 border border-white rounded-full" title="Running" />
                    )}
                  </div>
                  
                  {/* Name Text */}
                  <span className="mt-1 font-bold text-[11px] group-hover:bg-[#000080] group-hover:text-white px-1 leading-tight rounded-[1px] max-w-full truncate">
                    {app.name}
                  </span>
                  
                  {/* Quick description info */}
                  <span className="text-[9px] text-gray-500 leading-none mt-0.5 line-clamp-1 group-hover:text-gray-800">
                    {app.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div className="p-1 px-3 text-[10px] text-gray-500 text-right bg-[#C0C0C0] border-t border-gray-300">
        To launch apps, double-click or tap icons. Program Manager cannot be closed.
      </div>

    </div>
  );
}
