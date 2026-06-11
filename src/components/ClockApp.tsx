/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Eye, Moon } from 'lucide-react';
import { sounds } from './SoundEffects';

export default function ClockApp() {
  const [isAnalog, setIsAnalog] = useState(true);
  const [time, setTime] = useState(new Date());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

      {/* Footer Info */}
      <div className="text-center text-[10px] text-gray-500 py-1 border-t border-gray-300 flex items-center justify-center gap-1.5 mt-2">
        <Clock size={11} />
        <span>CLOCK.EXE | Local Time Zone Ready</span>
      </div>
    </div>
  );
}
