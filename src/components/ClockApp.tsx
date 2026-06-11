/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Eye, Moon, Bell, BellOff, Volume2 } from 'lucide-react';
import { sounds } from './SoundEffects';

export default function ClockApp() {
  const [isAnalog, setIsAnalog] = useState(true);
  const [time, setTime] = useState(new Date());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Alarm States
  const [alarmHour, setAlarmHour] = useState<number>(12);
  const [alarmMinute, setAlarmMinute] = useState<number>(0);
  const [alarmEnabled, setAlarmEnabled] = useState<boolean>(false);
  const [isRinging, setIsRinging] = useState<boolean>(false);

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Alarm matcher: Trigger on the exact second 0 of the matching hour and minute
  useEffect(() => {
    if (alarmEnabled && !isRinging) {
      const currentHour = time.getHours();
      const currentMinute = time.getMinutes();
      const currentSecond = time.getSeconds();

      if (currentHour === alarmHour && currentMinute === alarmMinute && currentSecond === 0) {
        setIsRinging(true);
      }
    }
  }, [time, alarmEnabled, alarmHour, alarmMinute, isRinging]);

  // Repeated sound alert when ringing
  useEffect(() => {
    if (isRinging) {
      // Play retro chiptune dual beep sound alert using system playBeep
      sounds.playBeep(920, 0.12, 'square');
      const subTimeout = setTimeout(() => {
        sounds.playBeep(920, 0.12, 'square');
      }, 180);

      return () => clearTimeout(subTimeout);
    }
  }, [time, isRinging]);

  // Handle Analog drawing
  useEffect(() => {
    if (!isAnalog) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const radius = canvas.width / 2;

    ctx.save();
    ctx.translate(radius, radius);

    // Draw Clock Face Border
    ctx.beginPath();
    ctx.arc(0, 0, radius - 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Secondary inner border
    ctx.beginPath();
    ctx.arc(0, 0, radius - 10, 0, 2 * Math.PI);
    ctx.strokeStyle = '#C0C0C0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw hour notches
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -(radius - 20));
      ctx.lineTo(0, -(radius - 14));
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
      ctx.stroke();
      ctx.rotate(-angle);
    }

    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    // Hour Hand
    const hourAngle = (hours * Math.PI) / 6 + (minutes * Math.PI) / 360;
    ctx.save();
    ctx.rotate(hourAngle);
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -(radius * 0.5));
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // Minute Hand
    const minuteAngle = (minutes * Math.PI) / 30 + (seconds * Math.PI) / 1800;
    ctx.save();
    ctx.rotate(minuteAngle);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, -(radius * 0.75));
    ctx.strokeStyle = '#000080'; // Navy typical minute hand
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // Second Hand
    const secondAngle = (seconds * Math.PI) / 30;
    ctx.save();
    ctx.rotate(secondAngle);
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(0, -(radius * 0.85));
    ctx.strokeStyle = '#FF0000'; // Red second hand
    ctx.lineWidth = 1.25;
    ctx.stroke();
    // Center pin
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }, [time, isAnalog]);

  const toggleStyle = () => {
    sounds.playTick();
    setIsAnalog(!isAnalog);
  };

  return (
    <div id="clock-app" className="flex flex-col h-full bg-[#C0C0C0] text-black text-xs font-sans p-2 select-none justify-between">
      {/* Menu Options */}
      <div className="flex gap-4 border-b border-gray-400 pb-1 mb-2 text-xs font-bold px-1 select-none">
        <button onClick={toggleStyle} className="hover:underline cursor-pointer">
          Settings: {isAnalog ? 'Analog' : 'Digital'}
        </button>
        <span className="text-gray-400">|</span>
        <span className="text-gray-600 font-normal">Active System Time</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-2">
        {isAnalog ? (
          <div className="w-[180px] h-[180px] flex items-center justify-center">
            <canvas ref={canvasRef} width="180" height="180" className="mx-auto block" />
          </div>
        ) : (
          <div className="text-center py-8">
            {/* Retro segment LCD panel look */}
            <div className="bg-[#EAEAEA] border-2 border-gray-600 border-b-white border-r-white p-4 font-mono select-all">
              <div className="text-3xl font-black text-[#000080] tracking-wider mb-1">
                {time.toLocaleTimeString([], { hour12: false })}
              </div>
              <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                {time.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alarm Settings Bevel Box */}
      <div 
        id="clock-alarm-settings"
        className="mt-2 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white p-2.5 bg-[#C0C0C0] rounded-sm flex flex-col gap-2 shadow-[inset_1px_1px_0_rgba(0,0,0,0.15)]"
      >
        <div className="flex items-center justify-between font-bold text-[10px] text-gray-700 uppercase">
          <span className="flex items-center gap-1">
            <Bell size={11} className={alarmEnabled ? 'text-[#000080]' : 'text-gray-500'} />
            Alarm System
          </span>
          {alarmEnabled ? (
            <span className="text-red-700 animate-pulse font-bold text-[9px] flex items-center gap-1 bg-[#FFF0F0] px-1 border border-red-300">
              ● SET {String(alarmHour).padStart(2, '0')}:{String(alarmMinute).padStart(2, '0')}
            </span>
          ) : (
            <span className="text-gray-500 font-bold text-[9px] bg-gray-100 px-1 border border-gray-300">
              DISABLED
            </span>
          )}
        </div>

        {isRinging ? (
          <div className="bg-red-600 text-white p-2 rounded-sm flex flex-col items-center justify-center gap-2 border border-black animate-pulse">
            <span className="font-extrabold text-[12px] uppercase text-yellow-300 tracking-wider">🔔 ALARM ACTIVE! 🔔</span>
            <span className="text-[10px] font-mono font-bold text-center">SYSTEM ALARM TRIGGERED</span>
            <button
              onClick={() => {
                sounds.playTick();
                setIsRinging(false);
              }}
              className="px-3 py-1 bg-white hover:bg-gray-100 text-red-700 font-bold border-2 border-black rounded-sm cursor-pointer shadow-md text-xs active:bg-gray-200"
            >
              DISMISS
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              {/* Hour Dropdown */}
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-700 font-bold mb-0.5">Hr</span>
                <select
                  value={alarmHour}
                  onChange={(e) => {
                    sounds.playTick();
                    setAlarmHour(parseInt(e.target.value));
                  }}
                  className="bg-white border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 font-mono text-[11px] w-14 cursor-pointer outline-none"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <span className="font-bold text-gray-700 pt-3 text-xs">:</span>

              {/* Minute Dropdown */}
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-700 font-bold mb-0.5">Min</span>
                <select
                  value={alarmMinute}
                  onChange={(e) => {
                    sounds.playTick();
                    setAlarmMinute(parseInt(e.target.value));
                  }}
                  className="bg-white border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 font-mono text-[11px] w-14 cursor-pointer outline-none"
                >
                  {Array.from({ length: 60 }).map((_, m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-1 items-end h-full pt-3">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep(920, 0.12, 'square');
                  const subTimeout = setTimeout(() => {
                    sounds.playBeep(920, 0.12, 'square');
                  }, 180);
                }}
                title="Test sound beeper"
                className="p-1 border-2 border-t-white border-l-white border-b-black border-r-black bg-[#C0C0C0] hover:bg-gray-100 active:border-inner rounded-sm cursor-pointer"
              >
                <Volume2 size={12} className="text-[#000080]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playTick();
                  setAlarmEnabled(!alarmEnabled);
                }}
                className={`px-3 py-1 border-2 border-t-white border-l-white border-b-black border-r-black active:border-inner cursor-pointer font-bold rounded-sm text-[10px] uppercase shadow-sm
                  ${alarmEnabled 
                    ? 'bg-red-100 text-red-800 border-b-red-900 border-r-red-900' 
                    : 'bg-[#C0C0C0] text-black hover:bg-gray-100'
                  }`}
              >
                {alarmEnabled ? 'Off' : 'On'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-gray-500 py-1 border-t border-gray-300 flex items-center justify-center gap-1.5 mt-2">
        <Clock size={11} />
        <span>CLOCK.EXE | Local Time Zone Ready</span>
      </div>
    </div>
  );
}
