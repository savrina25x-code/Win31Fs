/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Save, FileText, Check } from 'lucide-react';
import { sounds } from './SoundEffects';

const MOCK_FILES: Record<string, string> = {
  'README.TXT': `WELCOME TO WINDOWS 3.1
======================

This is a fully customizable retro Windows 3.1 
simulation built with React & Tailwind CSS.

Features included:
1. Program Manager: Double click apps to load.
2. Minesweeper: Authentic 16-bit logic and audio.
3. Paintbrush: Canvas drawing with classic colors.
4. Notepad: Reading/writing custom TXT files.
5. Clock: Elegant digital/analog dial toggle.
6. Control Panel: Change themes including hotdog stand!

You can write anything in this Notepad. Drag, resize 
and maximize windows as you please!
`,
  'TODO.TXT': `MY WINDOWS 3.1 TODO LIST:
- [x] Boot in DOS Prompt with C:\\> win
- [x] Configure retro square-wave synthesizer
- [ ] Win Minesweeper on intermediate difficulty
- [ ] Draw a masterpiece in Paintbrush
- [ ] Change color scheme to "Hotdog Stand"
- [ ] Minimize Program Manager to taskbar
`
};

export default function Notepad() {
  const [text, setText] = useState(MOCK_FILES['README.TXT']);
  const [filename, setFilename] = useState('README.TXT');
  const [wordWrap, setWordWrap] = useState(true);
  const [statusMsg, setStatusMsg] = useState('File loaded.');

  const handleLoadMockFile = (name: string) => {
    sounds.playTick();
    setFilename(name);
    setText(MOCK_FILES[name]);
    setStatusMsg(`Loaded ${name}`);
  };

  const handleNewFile = () => {
    sounds.playTick();
    setFilename('UNTITLED.TXT');
    setText('');
    setStatusMsg('New file created.');
  };

  const handleSave = () => {
    sounds.playBeep(600, 0.15, 'sine');
    setStatusMsg('Draft saved successfully to session.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const charCount = text.length;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  return (
    <div id="notepad-app" className="flex flex-col h-full bg-[#C0C0C0] text-black text-xs font-sans p-2 select-none">
      
      {/* File/Wrap menus */}
      <div className="flex gap-4 border-b border-gray-400 pb-1 mb-2 text-xs font-bold px-1 select-none">
        <div className="relative group">
          <button className="hover:bg-gray-300 px-1 py-0.5 cursor-pointer">File</button>
          <div className="absolute left-0 mt-0.5 w-[140px] bg-[#C0C0C0] border-2 border-white border-b-gray-600 border-r-gray-600 hidden group-hover:block z-[999] shadow-md">
            <button onClick={handleNewFile} className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-1.5">
              New File
            </button>
            {Object.keys(MOCK_FILES).map((f) => (
              <button key={f} onClick={() => handleLoadMockFile(f)} className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-1.5">
                Open {f}
              </button>
            ))}
            <div className="border-t border-gray-400 my-1"></div>
            <button onClick={handleSave} className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-1.5">
              Save Draft
            </button>
          </div>
        </div>

        <button 
          onClick={() => { sounds.playTick(); setWordWrap(!wordWrap); }}
          className="hover:bg-gray-300 px-1 py-0.5 cursor-pointer flex items-center gap-1"
        >
          {wordWrap ? <Check size={12} className="text-green-700" /> : null}
          Word Wrap
        </button>

        <span className="text-gray-400 self-center">|</span>
        <span className="text-gray-700 font-normal self-center select-all">Editing: <strong className="font-bold">{filename}</strong></span>
      </div>

      {/* Main text area */}
      <div className="flex-1 min-h-0 bg-white border-2 border-gray-600 border-b-white border-r-white p-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          wrap={wordWrap ? 'on' : 'off'}
          className="w-full h-full font-mono text-[13px] text-black resize-none outline-none border-none p-1 overflow-auto leading-relaxed select-text"
          placeholder="Type your notes here..."
        />
      </div>

      {/* Status Bar */}
      <div className="mt-2.5 px-2 py-1 bg-[#C0C0C0] border border-gray-400 flex items-center justify-between text-[10px] text-gray-700">
        <div className="flex items-center gap-1.5">
          <FileText size={12} className="text-gray-600" />
          <span>Characters: <strong>{charCount}</strong> | Words: <strong>{wordCount}</strong></span>
        </div>
        <div>
          {statusMsg && <span className="bg-[#FFFFE1] px-1 text-yellow-800 font-bold border border-yellow-300 animate-pulse">{statusMsg}</span>}
        </div>
      </div>

    </div>
  );
}
