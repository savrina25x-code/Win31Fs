/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sounds } from './SoundEffects';

interface Cell {
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  isExploded: boolean;
  neighborMines: number;
}

export default function Minesweeper() {
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(9);
  const [minesCount, setMinesCount] = useState(10);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [timer, setTimer] = useState(0);
  const [minesLeft, setMinesLeft] = useState(10);
  const [face, setFace] = useState<'smile' | 'scared' | 'dead' | 'cool'>('cool');
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize board
  const initializeBoard = useCallback((newRows = rows, newCols = cols, newMines = minesCount) => {
    // Fill empty cells
    const newGrid: Cell[][] = Array(newRows).fill(null).map((_, r) =>
      Array(newCols).fill(null).map((_, c) => ({
        x: r,
        y: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        isExploded: false,
        neighborMines: 0,
      }))
    );

    setGrid(newGrid);
    setGameState('idle');
    setTimer(0);
    setMinesLeft(newMines);
    setFace('smile');

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [rows, cols, minesCount]);

  useEffect(() => {
    initializeBoard();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Place mines on first click to guarantee safety (standard Minesweeper mechanics)
  const placeMines = (firstX: number, firstY: number, currentGrid: Cell[][]) => {
    let placedMines = 0;
    while (placedMines < minesCount) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      // Make sure we don't place mine on the first click cell or on an existing mine
      if (!currentGrid[r][c].isMine && (r !== firstX || c !== firstY)) {
        currentGrid[r][c].isMine = true;
        placedMines++;
      }
    }

    // Compute neighbor counts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!currentGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (r + dr >= 0 && r + dr < rows && c + dc >= 0 && c + dc < cols) {
                if (currentGrid[r + dr][c + dc].isMine) count++;
              }
            }
          }
          currentGrid[r][c].neighborMines = count;
        }
      }
    }
  };

  // Start timer helper
  const startTimer = () => {
    if (timerIntervalRef.current) return;
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => Math.min(prev + 1, 999));
    }, 1000);
  };

  // Reveal Cell
  const revealCell = (r: number, c: number) => {
    if (gameState === 'won' || gameState === 'lost') return;
    sounds.playTick();

    let currentGrid = [...grid.map(row => [...row])];
    let isFirstClick = gameState === 'idle';

    if (isFirstClick) {
      placeMines(r, c, currentGrid);
      setGameState('playing');
      startTimer();
    }

    const cell = currentGrid[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    if (cell.isMine) {
      // Game Over
      cell.isExploded = true;
      cell.isRevealed = true;
      revealAllMines(currentGrid, false);
      setFace('dead');
      setGameState('lost');
      sounds.playExplosion();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Breadth-First-Search or Flood Fill for 0 neighbors
    const queue: [number, number][] = [[r, c]];
    cell.isRevealed = true;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      const currCell = currentGrid[currR][currC];

      if (currCell.neighborMines === 0) {
        // Find neighbors
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const neighbor = currentGrid[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isMine && !neighbor.isFlagged) {
                neighbor.isRevealed = true;
                queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }

    setGrid(currentGrid);
    checkWinCondition(currentGrid);
  };

  const revealAllMines = (currentGrid: Cell[][], isWin: boolean) => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (currentGrid[r][c].isMine) {
          if (!isWin && !currentGrid[r][c].isFlagged) {
            currentGrid[r][c].isRevealed = true;
          } else if (isWin) {
            currentGrid[r][c].isFlagged = true;
          }
        }
      }
    }
    setGrid(currentGrid);
  };

  const checkWinCondition = (currentGrid: Cell[][]) => {
    let unrevealedSafeCells = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = currentGrid[r][c];
        if (!cell.isMine && !cell.isRevealed) {
          unrevealedSafeCells++;
        }
      }
    }

    if (unrevealedSafeCells === 0) {
      setGameState('won');
      setFace('cool');
      setMinesLeft(0);
      revealAllMines(currentGrid, true);
      sounds.playWin();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Flag cell (Right Click)
  const flagCell = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState === 'lost' || gameState === 'won') return;

    sounds.playTick();
    const currentGrid = [...grid.map(row => [...row])];
    const cell = currentGrid[r][c];

    if (cell.isRevealed) return;

    const newFlagged = !cell.isFlagged;
    cell.isFlagged = newFlagged;
    setMinesLeft((prev) => prev + (newFlagged ? -1 : 1));
    setGrid(currentGrid);
  };

  // Format digital panel
  const formatThreeDigits = (num: number) => {
    if (num < 0) return '000';
    if (num > 999) return '999';
    return String(num).padStart(3, '0');
  };

  // Custom cell appearance
  const renderCellContent = (cell: Cell) => {
    if (cell.isRevealed) {
      if (cell.isMine) {
        return <span className="text-black font-extrabold text-[15px]">💣</span>;
      }
      if (cell.neighborMines > 0) {
        const colors = [
          'text-[#0000FF]', // 1 blue
          'text-[#008000]', // 2 green
          'text-[#FF0000]', // 3 red
          'text-[#000080]', // 4 navy
          'text-[#800000]', // 5 dark red
          'text-[#008080]', // 6 teal
          'text-[#000000]', // 7 black
          'text-[#808080]', // 8 gray
        ];
        return (
          <span className={`font-black text-[14px] ${colors[cell.neighborMines - 1]}`}>
            {cell.neighborMines}
          </span>
        );
      }
      return null;
    }

    if (cell.isFlagged) {
      return <span className="text-[#FF0000] font-black text-[13px]">🚩</span>;
    }

    return null;
  };

  // Difficulty switch
  const changeDifficulty = (diff: 'beginner' | 'intermediate') => {
    if (diff === 'beginner') {
      setRows(9);
      setCols(9);
      setMinesCount(10);
      initializeBoard(9, 9, 10);
    } else {
      setRows(16);
      setCols(16);
      setMinesCount(40);
      initializeBoard(16, 16, 40);
    }
  };

  const faceIcon = {
    smile: '🙂',
    scared: '😮',
    dead: '😵',
    cool: '😎',
  }[face] || '🙂';

  return (
    <div id="minesweeper-app" className="flex flex-col select-none h-full bg-[#C0C0C0] text-black text-sm font-sans p-2 select-none">
      {/* Game Menu Options */}
      <div className="flex border-b border-gray-400 pb-1 mb-2 text-xs font-bold gap-3">
        <button 
          onClick={() => changeDifficulty('beginner')} 
          className={`px-2 py-0.5 border ${rows === 9 ? 'border-gray-500 bg-[#E0E0E0] shadow-inner' : 'border-transparent hover:bg-gray-300'}`}
        >
          Beginner (9x9)
        </button>
        <button 
          onClick={() => changeDifficulty('intermediate')} 
          className={`px-2 py-0.5 border ${rows === 16 ? 'border-gray-500 bg-[#E0E0E0] shadow-inner' : 'border-transparent hover:bg-gray-300'}`}
        >
          Intermediate (16x16)
        </button>
        <button 
          onClick={() => initializeBoard()} 
          className="ml-auto px-2 py-0.5 border border-transparent hover:bg-gray-300 active:bg-gray-400"
        >
          Reset Grid
        </button>
      </div>

      {/* Main Game Interface Board */}
      <div className="p-2 bg-[#C0C0C0] border-2 border-white border-b-gray-600 border-r-gray-600 flex flex-col gap-2 items-center justify-center">
        
        {/* Score Header */}
        <div className="w-full flex items-center justify-between px-3 py-2 bg-[#C0C0C0] border-2 border-gray-600 border-b-white border-r-white">
          
          {/* Mine count */}
          <div className="bg-black text-[#FF0000] font-mono text-2xl px-1.5 py-0.5 border-inner border border-gray-500 rounded-sm tracking-widest min-w-[55px] text-right">
            {formatThreeDigits(minesLeft)}
          </div>

          {/* Retro Face Button */}
          <button
            onMouseDown={() => { if (gameState === 'playing') setFace('scared'); }}
            onMouseUp={() => { if (gameState === 'playing') setFace('smile'); }}
            onClick={() => initializeBoard()}
            className="w-10 h-10 flex items-center justify-center bg-[#C0C0C0] text-2xl border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner active:border-gray-600 active:bg-[#C0C0C0] select-none cursor-pointer"
          >
            {faceIcon}
          </button>

          {/* Time indicator */}
          <div className="bg-black text-[#FF0000] font-mono text-2xl px-1.5 py-0.5 border-inner border border-gray-500 rounded-sm tracking-widest min-w-[55px] text-right">
            {formatThreeDigits(timer)}
          </div>

        </div>

        {/* Mines Field Grid */}
        <div className="border-2 border-gray-600 border-b-white border-r-white p-1 bg-[#808080]">
          <div 
            className="grid gap-[1px]"
            style={{ 
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              width: cols === 9 ? '225px' : '400px',
              height: cols === 9 ? '225px' : '400px',
            }}
          >
            {grid.map((row) =>
              row.map((cell) => {
                const isRevealedCell = cell.isRevealed;
                return (
                  <button
                    key={`${cell.x}-${cell.y}`}
                    onContextMenu={(e) => flagCell(e, cell.x, cell.y)}
                    onClick={() => revealCell(cell.x, cell.y)}
                    className={`
                      w-full h-full flex items-center justify-center select-none font-bold text-center aspect-square
                      ${isRevealedCell 
                        ? 'bg-[#C0C0C0] border border-gray-400' 
                        : 'bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-inner active:border-gray-500 active:bg-[#A0A0A0]'
                      }
                      ${cell.isExploded ? 'bg-[#FF0000]' : ''}
                    `}
                    disabled={gameState === 'won' || gameState === 'lost'}
                  >
                    {renderCellContent(cell)}
                  </button>
                );
              })
            )}
          </div>
        </div>

      </div>

      <div className="text-[10px] text-gray-600 text-center mt-2.5">
        Tip: Right-click to flag mines. Press Face to reset. Available in beginner and intermediate grids.
      </div>
    </div>
  );
}
