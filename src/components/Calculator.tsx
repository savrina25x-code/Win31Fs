/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sounds } from './SoundEffects';

export default function Calculator() {
  const [display, setDisplay] = useState('0.');
  const [equation, setEquation] = useState('');
  const [memory, setMemory] = useState<number | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [storedOperator, setStoredOperator] = useState<string | null>(null);
  const [firstValue, setFirstValue] = useState<number | null>(null);

  const handleDigit = (digit: string) => {
    sounds.playTick();
    if (display === '0.' || shouldResetDisplay) {
      if (digit === '.') {
        setDisplay('0.');
      } else {
        setDisplay(digit);
      }
      setShouldResetDisplay(false);
    } else {
      if (digit === '.' && display.includes('.')) {
        return; // Prevent multiple decimals
      }
      // If dot exists or appending normally
      let newVal = display;
      if (newVal.endsWith('.')) {
        newVal = newVal.slice(0, -1) + digit;
        if (!newVal.includes('.')) newVal += '.';
      } else {
        newVal = newVal + digit;
      }
      setDisplay(newVal);
    }
  };

  const handleOperator = (op: string) => {
    sounds.playTick();
    const currentVal = parseFloat(display);

    if (firstValue === null) {
      setFirstValue(currentVal);
    } else if (storedOperator) {
      const result = compute(firstValue, currentVal, storedOperator);
      setDisplay(String(result));
      setFirstValue(result);
    }

    setStoredOperator(op);
    setShouldResetDisplay(true);
  };

  const compute = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    sounds.playTick();
    if (firstValue === null || !storedOperator) return;

    const currentVal = parseFloat(display);
    const result = compute(firstValue, currentVal, storedOperator);
    
    setDisplay(String(result));
    setFirstValue(null);
    setStoredOperator(null);
    setShouldResetDisplay(true);
  };

  const handleClear = () => {
    sounds.playTick();
    setDisplay('0.');
    setFirstValue(null);
    setStoredOperator(null);
    setShouldResetDisplay(false);
  };

  const handleClearEntry = () => {
    sounds.playTick();
    setDisplay('0.');
  };

  const handleBackspace = () => {
    sounds.playTick();
    if (display.length > 2) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0.');
    }
  };

  // Memory functions
  const handleMemory = (memOp: 'MC' | 'MR' | 'MS' | 'M+') => {
    sounds.playTick();
    const val = parseFloat(display);
    switch (memOp) {
      case 'MC':
        setMemory(null);
        break;
      case 'MR':
        if (memory !== null) {
          setDisplay(String(memory));
          setShouldResetDisplay(true);
        }
        break;
      case 'MS':
        setMemory(val);
        setShouldResetDisplay(true);
        break;
      case 'M+':
        setMemory((prev) => (prev || 0) + val);
        setShouldResetDisplay(true);
        break;
    }
  };

  return (
    <div id="calculator-app" className="font-sans text-xs bg-[#C0C0C0] p-2 flex flex-col h-full select-none text-black">
      {/* File Menu (Authentic mockup) */}
      <div className="flex gap-4 border-b border-gray-400 pb-1 mb-2 text-[11px] font-bold">
        <span className="hover:underline cursor-pointer">Edit</span>
        <span className="hover:underline cursor-pointer">View</span>
        <span className="hover:underline cursor-pointer">Help</span>
      </div>

      {/* Screen container */}
      <div className="bg-white border-2 border-gray-600 border-b-white border-r-white text-right text-base px-2.5 py-1 mb-3.5 font-mono text-black select-all min-h-[32px] flex items-center justify-end leading-none">
        {display}
      </div>

      <div className="grid grid-cols-6 gap-2 flex-grow">
        
        {/* Left Side: Backspace, CE, C (top command row span 6 cols) */}
        <div className="col-span-1 border border-transparent"></div> {/* Padding */}
        <button onClick={handleBackspace} className="col-span-1.5 h-7 text-[#FF0000] font-bold bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner cursor-pointer rounded-sm active:bg-gray-100">
          Back
        </button>
        <button onClick={handleClearEntry} className="col-span-1.5 h-7 text-[#FF0000] font-bold bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner cursor-pointer rounded-sm active:bg-gray-100">
          CE
        </button>
        <button onClick={handleClear} className="col-span-1.5 h-7 text-[#FF0000] font-bold bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner cursor-pointer rounded-sm active:bg-gray-100">
          C
        </button>
        <div className="col-span-0.5"></div>

        {/* Memory and Digits Grid */}
        {/* Row 1 */}
        <button onClick={() => handleMemory('MC')} className="h-8 font-bold text-[#FF0000] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">MC</button>
        <button onClick={() => handleDigit('7')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">7</button>
        <button onClick={() => handleDigit('8')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">8</button>
        <button onClick={() => handleDigit('9')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">9</button>
        <button onClick={() => handleOperator('/')} className="h-8 font-bold text-[#FF0000] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">/</button>
        <button className="h-8 font-bold text-gray-500 bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner" disabled>sqrt</button>

        {/* Row 2 */}
        <button onClick={() => handleMemory('MR')} className="h-8 font-bold text-[#FF0000] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">MR</button>
        <button onClick={() => handleDigit('4')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">4</button>
        <button onClick={() => handleDigit('5')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">5</button>
        <button onClick={() => handleDigit('6')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">6</button>
        <button onClick={() => handleOperator('*')} className="h-8 font-bold text-[#FF0000] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">*</button>
        <button className="h-8 font-bold text-gray-500 bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner" disabled>%</button>

        {/* Row 3 */}
        <button onClick={() => handleMemory('MS')} className="h-8 font-bold text-[#FF0000] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">MS</button>
        <button onClick={() => handleDigit('1')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">1</button>
        <button onClick={() => handleDigit('2')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">2</button>
        <button onClick={() => handleDigit('3')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">3</button>
        <button onClick={() => handleOperator('-')} className="h-8 font-bold text-[#FF0000] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">-</button>
        <button className="h-8 font-bold text-gray-500 bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner" disabled>1/x</button>

        {/* Row 4 */}
        <button onClick={() => handleMemory('M+')} className="h-8 font-bold text-[#FF0000] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">M+</button>
        <button onClick={() => handleDigit('0')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">0</button>
        <button onClick={() => handleDigit('+/-')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">+/-</button>
        <button onClick={() => handleDigit('.')} className="h-8 font-bold text-[#0000FF] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">.</button>
        <button onClick={() => handleOperator('+')} className="h-8 font-bold text-[#FF0000] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">+</button>
        <button onClick={handleEquals} className="h-8 font-bold text-[#FF0000] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner">=</button>

      </div>

      <div className="flex items-center gap-2 mt-3 p-1.5 bg-[#C0C0C0] border border-gray-400">
        <div className="w-5 h-5 bg-white border-2 border-gray-600 border-b-white border-r-white flex items-center justify-center font-bold text-[9px] text-gray-600 shadow-inner">
          {memory !== null ? 'M' : ''}
        </div>
        <div className="text-[10px] text-gray-600 italic">Memory Status Box</div>
      </div>
    </div>
  );
}
