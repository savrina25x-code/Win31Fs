/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { WindowState, ThemeScheme, THEME_SCHEMES, AppId } from './types';
import { sounds } from './components/SoundEffects';

// Lazy loading classic programs
import ProgramManager from './components/ProgramManager';
import Minesweeper from './components/Minesweeper';
import Paintbrush from './components/Paintbrush';
import Calculator from './components/Calculator';
import Notepad from './components/Notepad';
import ClockApp from './components/ClockApp';
import ControlPanel from './components/ControlPanel';
import MediaPlayer from './components/MediaPlayer';

// Icons for minimized dock
const RETRO_APP_ICONS: Record<AppId, string> = {
  progman: '📁',
  minesweeper: '💣',
  paintbrush: '🖌️',
  calculator: '🧮',
  notepad: '🗒️',
  clock: '⏰',
  cpanel: '🎨',
  media: '🎬',
};

export default function App() {
  // Boot Sequence State
  // 'dos-boot' -> 'dos-type' -> 'splash' -> 'desktop'
  const [bootStep, setBootStep] = useState<'dos-boot' | 'dos-type' | 'splash' | 'desktop'>('dos-boot');
  const [dosTypeState, setDosTypeState] = useState('');
  
  // Theme state
  const [currentScheme, setCurrentScheme] = useState<ThemeScheme>('default');
  const [bgPattern, setBgPattern] = useState<string>('none');

  // Multi-window State Coordinator
  const [windows, setWindows] = useState<WindowState[]>([
    {
      id: 'progman',
      title: 'Program Manager',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      x: 30,
      y: 40,
      width: 530,
      height: 380,
      minWidth: 400,
      minHeight: 280,
      zIndex: 10,
    },
    {
      id: 'notepad',
      title: 'Notepad - README.TXT',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      x: 100,
      y: 80,
      width: 440,
      height: 320,
      minWidth: 300,
      minHeight: 200,
      zIndex: 12,
    },
    {
      id: 'minesweeper',
      title: 'Minesweeper',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 280,
      y: 120,
      width: 290,
      height: 480, // larger height to accommodate headers + 9x9 grid
      minWidth: 260,
      minHeight: 320,
      zIndex: 5,
    },
    {
      id: 'paintbrush',
      title: 'Paintbrush - [Untitled]',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 120,
      y: 140,
      width: 460,
      height: 380,
      minWidth: 320,
      minHeight: 280,
      zIndex: 5,
    },
    {
      id: 'calculator',
      title: 'Calculator',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 340,
      y: 150,
      width: 290,
      height: 320,
      minWidth: 250,
      minHeight: 280,
      zIndex: 5,
    },
    {
      id: 'clock',
      title: 'Clock',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 420,
      y: 50,
      width: 230,
      height: 280,
      minWidth: 200,
      minHeight: 220,
      zIndex: 5,
    },
    {
      id: 'cpanel',
      title: 'Control Panel',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 80,
      y: 180,
      width: 400,
      height: 380,
      minWidth: 280,
      minHeight: 300,
      zIndex: 5,
    },
    {
      id: 'media',
      title: 'Media Player v3.1',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 140,
      y: 110,
      width: 480,
      height: 440,
      minWidth: 320,
      minHeight: 380,
      zIndex: 5,
    },
  ]);

  // Window Drag state
  const [draggedApp, setDraggedApp] = useState<AppId | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, winX: 0, winY: 0 });

  // System Sound Indicator
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // DOS prompt typing sequence triggers
  useEffect(() => {
    if (bootStep === 'dos-boot') {
      const timer = setTimeout(() => {
        sounds.playBeep(320, 0.12, 'square');
        setBootStep('dos-type');
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (bootStep === 'dos-type') {
      let text = 'win';
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDosTypeState((prev) => prev + text.charAt(i));
          sounds.playBeep(450, 0.04, 'sine');
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            // Transition to Windows Splash Logo
            sounds.playBeep(650, 0.08, 'triangle');
            setBootStep('splash');
          }, 600);
        }
      }, 250);
      return () => clearInterval(interval);
    }

    if (bootStep === 'splash') {
      const timer = setTimeout(() => {
        // Play legendary arpeggio boot sound!
        sounds.playStartup();
        setBootStep('desktop');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [bootStep]);

  // Focus a window
  const focusWindow = (id: AppId) => {
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.zIndex), 10);
      return prev.map((w) => {
        if (w.id === id) {
          return { ...w, isMinimized: false, zIndex: maxZ + 1 };
        }
        return w;
      });
    });
  };

  // Drag handles (Desktop standard Mouse & Touch Events)
  const handleTitleMouseDown = (id: AppId, e: React.MouseEvent) => {
    focusWindow(id);
    const win = windows.find((w) => w.id === id);
    if (!win || win.isMaximized) return;

    setDraggedApp(id);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      winX: win.x,
      winY: win.y,
    });
  };

  const handleTitleTouchStart = (id: AppId, e: React.TouchEvent) => {
    focusWindow(id);
    const win = windows.find((w) => w.id === id);
    if (!win || win.isMaximized) return;

    const touch = e.touches[0];
    setDraggedApp(id);
    setDragStart({
      x: touch.clientX,
      y: touch.clientY,
      winX: win.x,
      winY: win.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedApp) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === draggedApp) {
          return {
            ...w,
            x: dragStart.winX + deltaX,
            y: Math.max(0, dragStart.winY + deltaY),
          };
        }
        return w;
      })
    );
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedApp) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;

    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === draggedApp) {
          return {
            ...w,
            x: dragStart.winX + deltaX,
            y: Math.max(0, dragStart.winY + deltaY),
          };
        }
        return w;
      })
    );
  };

  const handleMouseUp = () => {
    setDraggedApp(null);
  };

  const handleTouchEnd = () => {
    setDraggedApp(null);
  };

  // Close, Minimize, Maximize / Restore Toggles
  const handleCloseWindow = (id: AppId) => {
    sounds.playBeep(330, 0.1, 'sine');
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return { ...w, isOpen: false };
        }
        return w;
      })
    );
  };

  const handleMinimizeWindow = (id: AppId) => {
    sounds.playBeep(280, 0.08, 'sine');
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return { ...w, isMinimized: true };
        }
        return w;
      })
    );
  };

  const handleMaximizeWindow = (id: AppId) => {
    sounds.playBeep(440, 0.08, 'sine');
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return { ...w, isMaximized: !w.isMaximized };
        }
        return w;
      })
    );
  };

  // Action calling App launchers from Program Manager
  const handleOpenApp = (id: AppId) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return { ...w, isOpen: true, isMinimized: false };
        }
        return w;
      })
    );
    focusWindow(id);
  };

  const activeTheme = THEME_SCHEMES[currentScheme];

  // Pattern class conversion
  const getPatternClass = () => {
    if (bgPattern === 'checkers') return 'pat-checkers';
    if (bgPattern === 'waves') return 'pat-waves';
    if (bgPattern === 'slate') return 'pat-slate';
    return '';
  };

  // Double click header to toggle maximization
  const handleHeaderDoubleClick = (id: AppId) => {
    handleMaximizeWindow(id);
  };

  // Render OS booting loaders
  if (bootStep === 'dos-boot' || bootStep === 'dos-type') {
    return (
      <div className="w-screen h-screen bg-black text-[#A0A0A0] font-mono p-6 text-sm flex flex-col justify-between crt-scanlines select-none">
        <div className="flex flex-col gap-1.5 leading-relaxed tracking-wider">
          <p>AMIBIOS (C) 1992 AMERICAN MEGATRENDS INC.</p>
          <p>MS-DOS VERSION 6.22 (C)COPYRIGHT MICROSOFT CORP 1981-1994.</p>
          <br />
          <p>640KB BASE MEMORY OK</p>
          <p>15360KB EXTENDED MEMORY OK</p>
          <br />
          <p>C:\&gt; LOAD MOUSER.COM ... SUCCESS</p>
          <p>C:\&gt; LOAD SMARTDRV.EXE ... MEMORY OPTIMIZED</p>
          <br />
          <div className="flex items-center gap-1">
            <span>C:\&gt;</span>
            <span className="text-white font-bold">{dosTypeState}</span>
            <span className="w-2 h-4 bg-white animate-pulse"></span>
          </div>
        </div>

        <div className="text-center text-[10px] text-gray-600 uppercase">
          [ Press any key or wait for Windows 3.1 boot system to auto-launch ]
        </div>
      </div>
    );
  }

  if (bootStep === 'splash') {
    return (
      <div className="w-screen h-screen bg-[#000080] flex flex-col items-center justify-center select-none crt-scanlines text-white font-serif">
        <div className="bg-white text-[#000080] p-8 border-4 border-double border-[#000080] flex flex-col items-center gap-4 text-center w-[290px] win-bevel-out shadow-2xl">
          <div className="text-4xl font-extrabold flex items-center justify-center gap-2">
            <span className="rotate-3">💾</span>
            <span className="tracking-tight italic font-black">WIN 3.1</span>
          </div>
          <div className="w-full border-t-2 border-[#000080] my-2"></div>
          <div className="text-sm font-sans tracking-widest font-black leading-tight uppercase">
            MICROSOFT WINDOWS<span className="text-xs">™</span>
          </div>
          <div className="text-[10px] font-sans font-bold text-gray-600">
            Version 3.10
          </div>
          <div className="text-[9px] font-sans italic text-gray-500 mt-2 leading-none">
            Copyright (C) Microsoft Corp. 1985-1992<br />Web Architecture Ported 2026
          </div>
          <div className="w-full bg-[#000080]/10 h-1.5 mt-2 animate-pulse overflow-hidden relative">
            <div className="bg-[#000080] h-full w-[45%] animate-[infinite_1.5s_ease-in-out] absolute left-0"></div>
          </div>
        </div>
      </div>
    );
  }

  // Active desktop
  return (
    <div
      id="desktop-workspace"
      style={{ backgroundColor: activeTheme.desktopBg }}
      className={`w-screen h-screen flex flex-col relative overflow-hidden select-none font-sans ${getPatternClass()}`}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Top Banner indicating retro version */}
      <div 
        className="w-full h-8 px-4 flex items-center justify-between border-b shadow-sm z-50 select-none text-[11px] font-bold"
        style={{ 
          backgroundColor: activeTheme.buttonFace, 
          color: activeTheme.textColor,
          borderColor: activeTheme.buttonShadow 
        }}
      >
        <div className="flex items-center gap-2">
          <span>💾 Windows 3.1 Web Desktop Simulator</span>
          <span className="px-1.5 py-0.5 bg-yellow-100 border border-yellow-300 text-yellow-800 text-[9px] rounded-sm font-black uppercase">
            16-Bit Real Mode
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => sounds.playStartup()} 
            className="hover:underline cursor-pointer flex items-center gap-1 text-[10px]"
          >
            🔊 Replay Startup
          </button>
          <div className="w-[1.5px] h-3 bg-gray-400"></div>
          <div className="font-mono text-center">
            {new Date().toLocaleTimeString([], { hour12: false })}
          </div>
        </div>
      </div>

      {/* Main Wallpaper Workspace containing windows */}
      <div className="flex-1 w-full relative min-h-0">
        
        {windows.map((win) => {
          if (!win.isOpen) return null;
          
          // If minimized, do not render floating dialog box!
          if (win.isMinimized) return null;

          const isActive = Math.max(...windows.map(w => w.zIndex)) === win.zIndex;
          const bgHeader = isActive ? activeTheme.titleActiveBg : activeTheme.titleInactiveBg;
          const textHeader = isActive ? activeTheme.titleActiveText : activeTheme.titleInactiveText;

          // Compute size and position based on maximization
          const style: React.CSSProperties = win.isMaximized
            ? {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: win.zIndex,
              }
            : {
                position: 'absolute',
                top: `${win.y}px`,
                left: `${win.x}px`,
                width: `${win.width}px`,
                height: `${win.height}px`,
                minWidth: `${win.minWidth}px`,
                minHeight: `${win.minHeight}px`,
                zIndex: win.zIndex,
              };

          return (
            <div
              key={win.id}
              onClick={() => focusWindow(win.id)}
              style={{ 
                ...style, 
                backgroundColor: activeTheme.buttonFace,
                borderColor: activeTheme.buttonShadow
              }}
              className="flex flex-col overflow-hidden win-bevel-out shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
            >
              
              {/* Retro Title Bar */}
              <div
                style={{ backgroundColor: bgHeader, color: textHeader }}
                onMouseDown={(e) => handleTitleMouseDown(win.id, e)}
                onTouchStart={(e) => handleTitleTouchStart(win.id, e)}
                onDoubleClick={() => handleHeaderDoubleClick(win.id)}
                className="h-7 cursor-move select-none flex items-center justify-between px-1.5 font-bold text-xs"
              >
                {/* Close box (Windows 3.1 minus icon) */}
                <button
                  onClick={() => handleCloseWindow(win.id)}
                  style={{ backgroundColor: activeTheme.buttonFace }}
                  className="w-4 h-4 border border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex items-center justify-center font-black text-black text-[9px] hover:bg-gray-100 cursor-pointer shadow-sm active:border-inner"
                >
                  —
                </button>

                {/* Title */}
                <span className="flex-1 text-center font-extrabold uppercase tracking-wide truncate px-2 text-[11px]">
                  {win.title}
                </span>

                {/* Min / Max Buttons */}
                <div className="flex items-center gap-[1.5px]">
                  {/* Minimize arrow */}
                  <button
                    onClick={() => handleMinimizeWindow(win.id)}
                    style={{ backgroundColor: activeTheme.buttonFace }}
                    className="w-4 h-4 border border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex items-center justify-center font-bold text-black text-[9px] hover:bg-gray-100 cursor-pointer active:border-inner"
                  >
                    ▼
                  </button>
                  {/* Maximize triangle */}
                  <button
                    onClick={() => handleMaximizeWindow(win.id)}
                    style={{ backgroundColor: activeTheme.buttonFace }}
                    className="w-4 h-4 border border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex items-center justify-center font-bold text-black text-[9px] hover:bg-gray-100 cursor-pointer active:border-inner"
                  >
                    {win.isMaximized ? '▲' : '▲'}
                  </button>
                </div>

              </div>

              {/* Client area / Interior content page */}
              <div 
                style={{ backgroundColor: activeTheme.windowBg, color: activeTheme.textColor }}
                className="flex-1 min-h-0 relative overflow-auto border-t border-gray-400 p-0.5 win-bevel-in"
              >
                {win.id === 'progman' && (
                  <ProgramManager 
                    onOpenApp={handleOpenApp} 
                    openAppMap={windows.reduce((acc, currentVal) => {
                      acc[currentVal.id] = currentVal.isOpen && !currentVal.isMinimized;
                      return acc;
                    }, {} as Record<AppId, boolean>)}
                  />
                )}
                {win.id === 'minesweeper' && <Minesweeper />}
                {win.id === 'paintbrush' && <Paintbrush />}
                {win.id === 'calculator' && <Calculator />}
                {win.id === 'notepad' && <Notepad />}
                {win.id === 'clock' && <ClockApp />}
                {win.id === 'media' && <MediaPlayer />}
                {win.id === 'cpanel' && (
                  <ControlPanel
                    currentScheme={currentScheme}
                    onSchemeChange={setCurrentScheme}
                    backgroundPattern={bgPattern}
                    onBackgroundPatternChange={setBgPattern}
                  />
                )}
              </div>

            </div>
          );
        })}

      </div>

      {/* Minimized Dock: Sitting squarely in direct alignment of retro taskbars */}
      <div className="w-full p-2 h-16 border-t flex items-center gap-4 overflow-x-auto z-40 select-none bg-[#A0A0A0]/25 bg-opacity-35" style={{ borderColor: activeTheme.buttonShadow }}>
        {windows.map((win) => {
          const isIconicLayout = !win.isOpen || win.isMinimized;
          if (!isIconicLayout) return null;

          return (
            <button
              key={win.id}
              onClick={() => handleOpenApp(win.id)}
              className="flex flex-col items-center justify-center p-1.5 w-[75px] h-12 bg-[#C0C0C0] hover:bg-gray-200 active:bg-gray-300 border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner cursor-pointer rounded-sm group shadow-md"
            >
              <span className="text-[15px] leading-tight group-hover:scale-110 transition-transform">
                {RETRO_APP_ICONS[win.id]}
              </span>
              <span className="text-[8.5px] font-bold text-black group-hover:bg-[#000080] group-hover:text-white px-0.5 mt-0.5 max-w-full truncate">
                {win.id === 'progman' ? 'Progman' : win.title.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
