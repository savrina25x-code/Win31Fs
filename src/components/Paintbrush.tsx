/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Palette, Flame, Trash2, Square, Eye, Circle, Minimize, Edit2 } from 'lucide-react';
import { sounds } from './SoundEffects';

const CLASSIC_COLOR_PALETTE = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#FFFFFF', '#C0C0C0', '#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF'
];

type Tool = 'brush' | 'eraser' | 'line';

export default function Paintbrush() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeColor, setActiveColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get exact bounding size of container
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = (rect?.width || 500) - 16;
    canvas.height = (rect?.height || 350) - 130;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set white background by default
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.lineCap = 'round';
    context.strokeStyle = activeColor;
    context.lineWidth = brushSize;
    contextRef.current = context;
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Save snapshot of canvas before drawing for shape tools
    if (activeTool === 'line') {
      const ctx = contextRef.current;
      setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = contextRef.current;
    ctx.strokeStyle = activeTool === 'eraser' ? '#FFFFFF' : activeColor;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (activeTool !== 'line') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) {
      e.preventDefault();
      return;
    }

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = contextRef.current;

    if (activeTool === 'line' && snapshot) {
      // Restore canvas and draw line from start to current position
      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'brush' || activeTool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      contextRef.current?.closePath();
      setIsDrawing(false);
      setSnapshot(null);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div id="paintbrush-app" className="flex flex-col h-full bg-[#C0C0C0] text-black text-sm select-none p-2">
      
      {/* File/Edit Toolbar (retro look) */}
      <div className="flex gap-4 border-b border-gray-400 pb-1 mb-2 text-xs font-bold px-1">
        <button onClick={clearCanvas} className="hover:underline cursor-pointer flex items-center gap-1">
          <Trash2 size={12} /> Clear Page
        </button>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">Brush Style: Solid</span>
      </div>

      <div className="flex flex-1 gap-2 min-h-0">
        
        {/* Tool selector panel */}
        <div className="w-[60px] bg-[#C0C0C0] border-2 border-gray-600 border-b-white border-r-white flex flex-col p-1 gap-1.5 items-center">
          
          <button
            title="Brush"
            onClick={() => setActiveTool('brush')}
            className={`w-10 h-10 flex flex-col items-center justify-center border-t-white border-l-white border-b-gray-600 border-r-gray-600 border-2 active:border-inner
              ${activeTool === 'brush' ? 'bg-[#D2D2D2] border-inner border-gray-600' : 'bg-[#C0C0C0]'}`}
          >
            <Edit2 size={16} />
            <span className="text-[9px] font-bold">Brush</span>
          </button>

          <button
            title="Eraser"
            onClick={() => setActiveTool('eraser')}
            className={`w-10 h-10 flex flex-col items-center justify-center border-t-white border-l-white border-b-gray-600 border-r-gray-600 border-2 active:border-inner
              ${activeTool === 'eraser' ? 'bg-[#D2D2D2] border-inner border-gray-600' : 'bg-[#C0C0C0]'}`}
          >
            <div className="w-4 h-4 bg-white border border-gray-400 rotate-12 flex items-center justify-center text-[8px] font-black font-mono">E</div>
            <span className="text-[9px] font-bold">Eraser</span>
          </button>

          <button
            title="Line Tool"
            onClick={() => setActiveTool('line')}
            className={`w-10 h-10 flex flex-col items-center justify-center border-t-white border-l-white border-b-gray-600 border-r-gray-600 border-2 active:border-inner
              ${activeTool === 'line' ? 'bg-[#D2D2D2] border-inner border-gray-600' : 'bg-[#C0C0C0]'}`}
          >
            <div className="w-5 h-0.5 bg-black rotate-45 transform origin-center my-2"></div>
            <span className="text-[9px] font-bold">Line</span>
          </button>

          <div className="w-full border-t border-gray-500 my-1"></div>

          {/* Width selection */}
          <span className="text-[8px] font-extrabold uppercase text-gray-700 tracking-wider">Width</span>
          
          <button 
            onClick={() => setBrushSize(2)} 
            className={`w-8 h-4 flex items-center justify-center hover:bg-gray-300 ${brushSize === 2 ? 'ring-1 ring-gray-600 bg-gray-200' : ''}`}
          >
            <div className="w-4 h-[2px] bg-black"></div>
          </button>
          
          <button 
            onClick={() => setBrushSize(4)} 
            className={`w-8 h-4 flex items-center justify-center hover:bg-gray-300 ${brushSize === 4 ? 'ring-1 ring-gray-600 bg-gray-200' : ''}`}
          >
            <div className="w-4 h-[4px] bg-black"></div>
          </button>

          <button 
            onClick={() => setBrushSize(8)} 
            className={`w-8 h-4 flex items-center justify-center hover:bg-gray-300 ${brushSize === 8 ? 'ring-1 ring-gray-600 bg-gray-200' : ''}`}
          >
            <div className="w-4 h-[8px] bg-black"></div>
          </button>

          <button 
            onClick={() => setBrushSize(14)} 
            className={`w-8 h-5 flex items-center justify-center hover:bg-gray-300 ${brushSize === 14 ? 'ring-1 ring-gray-600 bg-gray-200' : ''}`}
          >
            <div className="w-4 h-[12px] bg-black"></div>
          </button>

        </div>

        {/* Canvas panel */}
        <div className="flex-1 bg-white border-2 border-gray-600 border-b-white border-r-white overflow-hidden relative cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="block"
          />
        </div>

      </div>

      {/* Classic Color grid palette */}
      <div className="mt-2 p-1.5 bg-[#C0C0C0] border-2 border-gray-600 border-b-white border-r-white flex items-center gap-2">
        <div className="flex flex-col items-center justify-center border border-gray-500 w-11 h-11 bg-white shadow-inner relative">
          <div 
            className="w-5 h-5 border border-black absolute top-1 left-1 z-10 shadow-md"
            style={{ backgroundColor: activeColor }}
            title="Primary"
          />
          <div 
            className="w-5 h-5 border border-dashed border-gray-400 absolute bottom-1 right-1 bg-white" 
            title="Secondary"
          />
        </div>

        <div className="grid grid-cols-8 gap-0.5 flex-1 max-w-[340px]">
          {CLASSIC_COLOR_PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => {
                setActiveColor(color);
                sounds.playTick();
              }}
              style={{ backgroundColor: color }}
              className={`h-[18px] border border-black focus:outline-none relative active:scale-95
                ${activeColor === color ? 'scale-105 z-10 outline-2 outline-white' : ''}`}
            />
          ))}
        </div>
        
        <div className="text-[10px] italic font-bold flex-1 text-right text-gray-700 select-none">
          Paintbrush v3.1
        </div>
      </div>

    </div>
  );
}
