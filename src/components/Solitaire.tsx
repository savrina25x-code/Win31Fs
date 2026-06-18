/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, HelpCircle, Trophy, RefreshCcw, LayoutGrid, Award } from 'lucide-react';
import { sounds } from './SoundEffects';

interface Card {
  id: string; // unique ID
  suit: 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
  value: number; // 1 = Ace, 11 = Jack, 12 = Queen, 13 = King
  isFaceUp: boolean;
}

type CardBackStyle = 'blue-maze' | 'sunset-palm' | 'castle' | 'rainbow-neon';

// Helper to format suits and values
const SUIT_SYMBOLS = {
  H: '♥', // Hearts
  D: '♦', // Diamonds
  C: '♣', // Clubs
  S: '♠'  // Spades
};

const SUIT_COLORS = {
  H: 'text-red-600',
  D: 'text-red-500',
  C: 'text-black',
  S: 'text-black'
};

const CARD_LABELS: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K'
};

export default function Solitaire() {
  // Card table structures
  const [deck, setDeck] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  
  // 4 Foundations (Hearts, Diamonds, Clubs, Spades / or any suited layout)
  // Initially we map to array of card lists
  const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []]);
  
  // 7 Tableau columns
  const [tableaus, setTableaus] = useState<Card[][]>([[], [], [], [], [], [], []]);

  // Selected card for movement input
  const [selectedPileType, setSelectedPileType] = useState<'tableau' | 'waste' | null>(null);
  const [selectedPileIndex, setSelectedPileIndex] = useState<number>(-1);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(-1);

  // Card Back Visual Decal setting
  const [cardBack, setCardBack] = useState<CardBackStyle>('blue-maze');
  const [isWin, setIsWin] = useState(false);

  // Canvas for the majestic Win Cascade drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isCascadeActiveRef = useRef(false);
  const cascadeAnimationIdRef = useRef<number | null>(null);

  // Score count and Move counts
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);

  // Generate and start a new game
  const initGame = () => {
    sounds.playBeep(523.25, 0.1, 'triangle'); // C5
    setTimeout(() => {
      sounds.playBeep(659.25, 0.1, 'triangle'); // E5
    }, 100);

    // Stop cascading animation if active
    stopCascade();

    const suits: ('H' | 'D' | 'C' | 'S')[] = ['H', 'D', 'C', 'S'];
    const newDeck: Card[] = [];

    // Build standard 52 deck
    suits.forEach((suit) => {
      for (let val = 1; val <= 13; val++) {
        newDeck.push({
          id: `${suit}-${val}`,
          suit,
          value: val,
          isFaceUp: false
        });
      }
    });

    // Shuffle deck (Fisher-Yates)
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    // Build Tableaus: Column 0 has 1 card, Col 1 has 2, ..., Col 6 has 7
    let deckIdx = 0;
    const tempTableaus: Card[][] = Array.from({ length: 7 }, () => []);
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = newDeck[deckIdx++];
        // Make the top-most card of each column face up
        if (row === col) {
          card.isFaceUp = true;
        }
        tempTableaus[col].push(card);
      }
    }

    // Rest of the cards go to the Deck pile
    const remainingDeck = newDeck.slice(deckIdx);

    setTableaus(tempTableaus);
    setDeck(remainingDeck);
    setWaste([]);
    setFoundations([[], [], [], []]);
    setSelectedPileType(null);
    setSelectedPileIndex(-1);
    setSelectedCardIndex(-1);
    setIsWin(false);
    setScore(0);
    setMoves(0);
  };

  useEffect(() => {
    initGame();
    return () => {
      stopCascade();
    };
  }, []);

  // Waste card cycle draw
  const handleDrawCard = () => {
    if (isWin || isCascadeActiveRef.current) return;
    sounds.playTick();
    setMoves((prev) => prev + 1);

    if (deck.length === 0) {
      if (waste.length === 0) return; // Completely empty
      // Recycle waste back to deck
      const recycled = [...waste].reverse().map((c) => ({ ...c, isFaceUp: false }));
      setDeck(recycled);
      setWaste([]);
      setScore((prev) => Math.max(0, prev - 20));
    } else {
      // Draw 1 card to Waste
      const nextCard = deck[0];
      const updatedDeck = deck.slice(1);
      nextCard.isFaceUp = true;
      setWaste((prev) => [...prev, nextCard]);
    }
    clearSelection();
  };

  const clearSelection = () => {
    setSelectedPileType(null);
    setSelectedPileIndex(-1);
    setSelectedCardIndex(-1);
  };

  // Sound effects tailored for cards
  const playCardPlaceSound = () => {
    sounds.playBeep(400, 0.08, 'sawtooth');
  };

  // Move checks and card selection logic
  const handleCardClick = (pileType: 'tableau' | 'waste', pileIdx: number, cardIdx: number) => {
    if (isWin || isCascadeActiveRef.current) return;

    // Check if the clicked card is face-down
    if (pileType === 'tableau') {
      const card = tableaus[pileIdx][cardIdx];
      if (!card.isFaceUp) {
        // If it's the top card, flip it face up
        if (cardIdx === tableaus[pileIdx].length - 1) {
          sounds.playTick();
          const updated = [...tableaus];
          updated[pileIdx][cardIdx].isFaceUp = true;
          setTableaus(updated);
          setScore((prev) => prev + 5);
          setMoves((prev) => prev + 1);
        }
        clearSelection();
        return;
      }
    }

    // Selection logic
    if (selectedPileIndex === -1) {
      // Select source
      setSelectedPileType(pileType);
      setSelectedPileIndex(pileIdx);
      setSelectedCardIndex(cardIdx);
      sounds.playTick();
    } else {
      // Already selected. If clicking same card, cancel selection
      if (selectedPileType === pileType && selectedPileIndex === pileIdx && selectedCardIndex === cardIdx) {
        clearSelection();
        sounds.playTick();
        return;
      }

      // Move source to target tableau column
      if (pileType === 'tableau') {
        attemptMoveToTableau(pileIdx);
      } else {
        // Not a valid tableau move landing, clear selection
        clearSelection();
      }
    }
  };

  // Move check to empty Tableau spot (must be King)
  const attemptMoveToTableau = (targetColIdx: number) => {
    const targetCol = tableaus[targetColIdx];
    let movingCards: Card[] = [];

    if (selectedPileType === 'waste') {
      movingCards = [waste[waste.length - 1]];
    } else if (selectedPileType === 'tableau') {
      movingCards = tableaus[selectedPileIndex].slice(selectedCardIndex);
    }

    if (movingCards.length === 0) return;

    const baseCard = movingCards[0];
    let isValid = false;

    if (targetCol.length === 0) {
      // Must be a King (13) to land on empty tableau
      if (baseCard.value === 13) {
        isValid = true;
      }
    } else {
      // Must be alternative suit colors and value strictly lower by 1
      const topCard = targetCol[targetCol.length - 1];
      const isAltColor = isOppositeColor(baseCard.suit, topCard.suit);
      const isStepDown = topCard.value === baseCard.value + 1;

      if (isAltColor && isStepDown) {
        isValid = true;
      }
    }

    if (isValid) {
      // Apply movement state update
      const nextTableaus = [...tableaus];
      nextTableaus[targetColIdx] = [...targetCol, ...movingCards];

      if (selectedPileType === 'waste') {
        setWaste((prev) => prev.slice(0, prev.length - 1));
        setScore((prev) => prev + 10);
      } else if (selectedPileType === 'tableau') {
        nextTableaus[selectedPileIndex] = nextTableaus[selectedPileIndex].slice(0, selectedCardIndex);
        setScore((prev) => prev + 5);
      }

      setTableaus(nextTableaus);
      setMoves((prev) => prev + 1);
      playCardPlaceSound();
      checkFlippedCardsAuto();
    } else {
      // Play rejection tick
      sounds.playBeep(220, 0.15, 'sawtooth');
    }

    clearSelection();
  };

  // Check and flip top cards if open
  const checkFlippedCardsAuto = () => {
    let changed = false;
    const nextTableaus = tableaus.map((col) => {
      if (col.length > 0 && !col[col.length - 1].isFaceUp) {
        col[col.length - 1].isFaceUp = true;
        changed = true;
      }
      return col;
    });

    if (changed) {
      setTableaus(nextTableaus);
      setScore((prev) => prev + 5);
    }
  };

  // Helper to test suited color opposites
  const isOppositeColor = (suit1: 'H' | 'D' | 'C' | 'S', suit2: 'H' | 'D' | 'C' | 'S') => {
    const isRed1 = suit1 === 'H' || suit1 === 'D';
    const isRed2 = suit2 === 'H' || suit2 === 'D';
    return isRed1 !== isRed2;
  };

  // Move to Foundation (Aces up to Kings)
  const attemptMoveToFoundation = (fIdx: number) => {
    if (selectedPileIndex === -1 && selectedPileType === null) return;
    if (isWin || isCascadeActiveRef.current) return;

    let card: Card | null = null;
    if (selectedPileType === 'waste') {
      card = waste[waste.length - 1];
    } else if (selectedPileType === 'tableau') {
      // Must be only the SINGLE top-most card of the column
      const col = tableaus[selectedPileIndex];
      if (selectedCardIndex === col.length - 1) {
        card = col[col.length - 1];
      }
    }

    if (!card) {
      clearSelection();
      return;
    }

    const currentFCol = foundations[fIdx];
    let isValid = false;

    if (currentFCol.length === 0) {
      // Must be an Ace to start foundation
      if (card.value === 1) {
        isValid = true;
      }
    } else {
      const topFCard = currentFCol[currentFCol.length - 1];
      const isSameSuit = topFCard.suit === card.suit;
      const isStepUp = card.value === topFCard.value + 1;
      if (isSameSuit && isStepUp) {
         isValid = true;
      }
    }

    if (isValid) {
      const nextFoundations = [...foundations];
      nextFoundations[fIdx] = [...currentFCol, card];
      setFoundations(nextFoundations);

      if (selectedPileType === 'waste') {
        setWaste((prev) => prev.slice(0, prev.length - 1));
      } else if (selectedPileType === 'tableau') {
        const nextTableaus = [...tableaus];
        nextTableaus[selectedPileIndex] = nextTableaus[selectedPileIndex].slice(0, nextTableaus[selectedPileIndex].length - 1);
        setTableaus(nextTableaus);
      }

      setScore((prev) => prev + 15);
      setMoves((prev) => prev + 1);
      playCardPlaceSound();
      checkWinStatus(nextFoundations);
    } else {
      sounds.playBeep(220, 0.15, 'sawtooth');
    }

    clearSelection();
  };

  // Double Click any card to auto-move to matching foundation
  const handleCardDoubleClick = (card: Card, sourcePile: 'tableau' | 'waste', pileIdx: number) => {
    if (isWin || isCascadeActiveRef.current) return;
    
    // Find matching foundation slot
    let fSlotIdx = -1;
    for (let f = 0; f < 4; f++) {
      const fCol = foundations[f];
      if (fCol.length === 0) {
        if (card.value === 1) { // Ace can land
          fSlotIdx = f;
          break;
        }
      } else {
        const top = fCol[fCol.length - 1];
        if (top.suit === card.suit && card.value === top.value + 1) {
          fSlotIdx = f;
          break;
        }
      }
    }

    if (fSlotIdx !== -1) {
      // Found valid foundation! Auto-move it.
      sounds.playBeep(480, 0.1, 'triangle');
      const nextFoundations = [...foundations];
      nextFoundations[fSlotIdx] = [...nextFoundations[fSlotIdx], card];
      setFoundations(nextFoundations);

      if (sourcePile === 'waste') {
        setWaste((prev) => prev.slice(0, prev.length - 1));
      } else {
        const nextTableaus = [...tableaus];
        nextTableaus[pileIdx] = nextTableaus[pileIdx].slice(0, nextTableaus[pileIdx].length - 1);
        setTableaus(nextTableaus);
      }

      setScore((prev) => prev + 15);
      setMoves((prev) => prev + 1);
      checkFlippedCardsAuto();
      checkWinStatus(nextFoundations);
      clearSelection();
    }
  };

  // Auto-win if all 4 foundations reached 13 cards (completed)
  const checkWinStatus = (currF: Card[][]) => {
    const isCompleted = currF.every((col) => col.length === 13);
    if (isCompleted) {
      setIsWin(true);
      triggerVictoryCascade();
    }
  };

  // CLASSIC 16-BIT WIN CASCADE ANIMATION
  // Renders bouncing card objects onto a high-performance 2D Canvas!
  const triggerVictoryCascade = () => {
    sounds.playBeep(523.25, 0.3, 'square');
    sounds.playBeep(659.25, 0.3, 'square');
    sounds.playBeep(783.99, 0.5, 'square');

    isCascadeActiveRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Prepare full card arrays ordered from K down to Ace from each foundation pile
    interface ActiveBouncingCard {
      suit: 'H' | 'D' | 'C' | 'S';
      value: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
    }

    const cardsToAnimate: ActiveBouncingCard[] = [];
    
    // Grab all foundation card indices to cascade them one by one sequentially
    // Solitaire cascades Kings down to Aces, starting with Suit 1, then Suit 2, etc.
    const suitsSeq: ('H' | 'D' | 'C' | 'S')[] = ['H', 'D', 'C', 'S'];
    
    // Generate simulated bounce structures for all 13 x 4 cards
    suitsSeq.forEach((suit, sIdx) => {
      // Find starting pos on screen (approx foundation pile position coordinate)
      const startX = 230 + sIdx * 56;
      const startY = 32;

      for (let v = 13; v >= 1; v--) {
        cardsToAnimate.push({
          suit,
          value: v,
          x: startX,
          y: startY,
          // Random horizontal speed bouncing to the left/right
          vx: (Math.random() * 4 + 1.5) * (Math.random() > 0.5 ? 1 : -1),
          // Initial slight upwards bounce gravity starts pulling
          vy: -Math.random() * 5 - 2
        });
      }
    });

    let currentAnimatingIdx = 0;
    const activeCardsInMotion: ActiveBouncingCard[] = [];
    
    // Spawn cards one-by-one periodically
    let spawnTimer = 0;

    // Clear Canvas initially
    ctx.fillStyle = '#1a5b32';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const CARDS_W = 48;
    const CARDS_H = 68;

    const renderLoop = () => {
      if (!isCascadeActiveRef.current) return;

      // Span a new card from queue every 24 frames
      if (spawnTimer <= 0 && currentAnimatingIdx < cardsToAnimate.length) {
        activeCardsInMotion.push(cardsToAnimate[currentAnimatingIdx]);
        currentAnimatingIdx++;
        spawnTimer = 18; // wait about 300ms before triggering next card
      }
      spawnTimer--;

      // Render each active moving card
      activeCardsInMotion.forEach((card, idx) => {
        // Physics update
        card.x += card.vx;
        card.y += card.vy;
        card.vy += 0.35; // Gravity pull

        // Bounce floor condition
        if (card.y + CARDS_H >= canvas.height) {
          card.y = canvas.height - CARDS_H;
          card.vy = -card.vy * 0.85; // Lost energy bounce
        }

        // Draw classic retro card card
        ctx.fillStyle = '#FFFFFF';
        // Rounded border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, CARDS_W, CARDS_H, 2);
        ctx.fill();
        ctx.stroke();

        // Details
        const suitSym = SUIT_SYMBOLS[card.suit];
        const isRed = card.suit === 'H' || card.suit === 'D';
        ctx.fillStyle = isRed ? '#EF4444' : '#000000';
        ctx.font = 'bold 11px VT323, monospace';
        
        // Face value and suit character
        const label = CARD_LABELS[card.value];
        ctx.fillText(label, card.x + 4, card.y + 13);
        ctx.font = '16px serif';
        ctx.fillText(suitSym, card.x + 4, card.y + 28);
        ctx.font = 'bold 32px serif';
        ctx.fillText(suitSym, card.x + 14, card.y + 54);
      });

      // Keep requesting animation frame to draw trailers
      // Notice we do NOT clear the whole canvas every time! 
      // This leaves the iconic beautiful card paths/trailers cascade trail we love!
      cascadeAnimationIdRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  };

  const stopCascade = () => {
    isCascadeActiveRef.current = false;
    if (cascadeAnimationIdRef.current) {
      cancelAnimationFrame(cascadeAnimationIdRef.current);
      cascadeAnimationIdRef.current = null;
    }
  };

  return (
    <div 
      id="solitaire-app-container" 
      className="flex flex-col h-full bg-[#1a5b32] text-white select-none font-sans justify-between relative"
    >
      
      {/* Top Solitaire Status Toolbar Bar */}
      <div className="bg-[#C0C0C0] text-black border-b border-gray-400 p-1 flex items-center justify-between font-sans text-[11px] font-bold">
        <div className="flex items-center gap-2">
          <button 
            onClick={initGame} 
            className="flex items-center gap-1 hover:bg-gray-300 px-1.5 py-0.5 border border-transparent hover:border-gray-500 rounded-sm cursor-pointer"
          >
            <RotateCw size={11} /> Game
          </button>
          <span className="text-gray-400">|</span>
          <span className="text-[10px] text-[#000080]">Cards Back:</span>
          <select
            value={cardBack}
            onChange={(e) => {
              sounds.playTick();
              setCardBack(e.target.value as CardBackStyle);
            }}
            className="bg-white border text-[10px] py-0.5 px-1 font-sans cursor-pointer outline-none font-normal"
          >
            <option value="blue-maze">🌀 Retro Blue Maze</option>
            <option value="sunset-palm">🌴 Sunset Palms</option>
            <option value="castle">🦇 Midnight Castle</option>
            <option value="rainbow-neon">🌈 8-Bit Rainbow</option>
          </select>
        </div>

        {/* Dashboard parameters */}
        <div className="flex items-center gap-3 font-mono text-[10px] pr-2">
          <span>Score: <strong className="text-emerald-800">{score}</strong></span>
          <span>Moves: <strong className="text-blue-800">{moves}</strong></span>
          
          <button 
            onClick={() => {
              // Action hack for instant victory cascade test
              triggerVictoryCascade();
            }}
            id="solitaire-cheat-cascade"
            className="bg-red-700 hover:bg-red-800 text-white font-sans text-[9px] hover:scale-105 active:scale-95 px-1.5 py-0.5 rounded border border-black cursor-pointer shadow-sm transition-transform"
            title="Easter egg! Trigger trailing cascade bounce."
          >
            🎬 CASCADE!
          </button>
        </div>
      </div>

      {/* Main card gameboard table */}
      <div 
        id="card-gameboard-layout" 
        className="flex-1 p-2 flex flex-col gap-3 h-full relative"
      >
        
        {/* Cascade Fullscreen Canvas overlays only when cascade is running! */}
        {isCascadeActiveRef.current && (
          <div className="absolute inset-0 z-40 bg-transparent flex flex-col justify-end">
            <canvas 
              ref={canvasRef} 
              width={560} 
              height={400} 
              className="w-full h-[380px] bg-transparent block"
            />
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black/85 text-yellow-300 border border-yellow-300 px-4 py-1.5 font-bold font-mono text-center shadow-lg text-[11px] rounded-md z-50 flex items-center gap-2">
              <Award size={13} className="animate-spin" />
              <span>THE GAME WAS SUCCESSFULLY COMPLETED!</span>
              <button
                onClick={() => {
                  sounds.playTick();
                  stopCascade();
                  initGame();
                }}
                className="ml-2 bg-yellow-400 text-black px-1.5 py-0.5 uppercase tracking-wide rounded hover:bg-yellow-300 pointer-events-auto cursor-pointer font-extrabold text-[9px]"
              >
                Deal New
              </button>
            </div>
          </div>
        )}

        {/* Rows stack container */}
        <div className="flex flex-col gap-3 w-full">
          
          {/* TOP ROW: Deck, Waste, and 4 Foundations */}
          <div className="grid grid-cols-7 gap-1 bg-green-950 p-2 rounded-sm border border-green-800 shadow-inner">
            
            {/* 1. Deck Pile (Face Down) */}
            <div className="flex flex-col items-center">
              <div 
                onClick={handleDrawCard}
                className={`relative w-[48px] h-[68px] rounded border-2 cursor-pointer transition-transform duration-75 active:scale-95 flex items-center justify-center 
                  ${deck.length > 0 ? 'border-white hover:brightness-110' : 'border-gray-500 bg-transparent'}`}
              >
                {deck.length > 0 ? (
                  <CardBackVisual style={cardBack} />
                ) : (
                  <div className="text-gray-500 font-mono text-[8px] uppercase font-bold text-center">
                    <RefreshCcw size={14} className="mx-auto text-gray-500 mb-0.5 opacity-60" />
                    Reset
                  </div>
                )}
                {deck.length > 0 && (
                  <span className="absolute bottom-0 text-[8px] font-mono font-bold bg-black/60 text-white px-0.5 rounded-sm">
                    {deck.length}
                  </span>
                )}
              </div>
            </div>

            {/* 2. Waste Pile (Face Up) */}
            <div className="flex flex-col items-center">
              <div 
                className={`relative w-[48px] h-[68px] rounded border-2 transition-shadow duration-100 flex items-center justify-center bg-white
                  ${waste.length > 0 ? 'border-white' : 'border-green-800 bg-black/10'}`}
              >
                {waste.length > 0 ? (
                  <div 
                    onClick={() => handleCardClick('waste', 0, waste.length - 1)}
                    onDoubleClick={() => handleCardDoubleClick(waste[waste.length - 1], 'waste', 0)}
                    className={`w-full h-full p-1 flex flex-col justify-between cursor-pointer rounded-sm
                      ${selectedPileType === 'waste' ? 'ring-2 ring-yellow-400 bg-yellow-100' : 'bg-white'}`}
                  >
                    <div className="flex justify-between leading-none">
                      <span className={`font-bold font-mono text-[10px] ${SUIT_COLORS[waste[waste.length - 1].suit]}`}>
                        {CARD_LABELS[waste[waste.length - 1].value]}
                      </span>
                      <span className={`text-[10px] ${SUIT_COLORS[waste[waste.length - 1].suit]}`}>
                        {SUIT_SYMBOLS[waste[waste.length - 1].suit]}
                      </span>
                    </div>
                    <div className={`text-center text-xl self-center leading-none ${SUIT_COLORS[waste[waste.length - 1].suit]}`}>
                      {SUIT_SYMBOLS[waste[waste.length - 1].suit]}
                    </div>
                    <div className="flex justify-end leading-none">
                      <span className={`font-bold text-[9px] ${SUIT_COLORS[waste[waste.length - 1].suit]}`}>
                        {CARD_LABELS[waste[waste.length - 1].value]}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-700 font-mono text-[9px]">-</span>
                )}
              </div>
            </div>

            {/* Spacer */}
            <div className="w-[48px]" />

            {/* 3. Four Foundations (H, D, C, S) */}
            {foundations.map((fCol, fIdx) => {
              const hasCards = fCol.length > 0;
              const topCard = hasCards ? fCol[fCol.length - 1] : null;

              return (
                <div key={fIdx} className="flex flex-col items-center">
                  <div
                    onClick={() => {
                      if (selectedPileIndex !== -1) {
                        attemptMoveToFoundation(fIdx);
                      }
                    }}
                    className={`relative w-[48px] h-[68px] rounded border-2 flex items-center justify-center transition-colors bg-white/5 cursor-pointer
                      ${hasCards ? 'border-white bg-white' : 'border-green-800 hover:bg-white/10'}`}
                  >
                    {topCard ? (
                      <div className="w-full h-full p-1 flex flex-col justify-between rounded-sm bg-white">
                        <div className="flex justify-between leading-none">
                          <span className={`font-bold font-mono text-[10px] ${SUIT_COLORS[topCard.suit]}`}>
                            {CARD_LABELS[topCard.value]}
                          </span>
                          <span className={`text-[10px] ${SUIT_COLORS[topCard.suit]}`}>
                            {SUIT_SYMBOLS[topCard.suit]}
                          </span>
                        </div>
                        <div className={`text-center text-lg self-center leading-none ${SUIT_COLORS[topCard.suit]}`}>
                          {SUIT_SYMBOLS[topCard.suit]}
                        </div>
                        <div className="text-[7px] text-gray-400 absolute top-0.5 right-0.5 bg-black/10 px-0.5 rounded font-mono">
                          {fCol.length}/13
                        </div>
                        <div className="flex justify-end leading-none">
                          <span className={`font-bold text-[9px] ${SUIT_COLORS[topCard.suit]}`}>
                            {CARD_LABELS[topCard.value]}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-green-700 text-lg opacity-40">
                        {fIdx === 0 && SUIT_SYMBOLS.H}
                        {fIdx === 1 && SUIT_SYMBOLS.D}
                        {fIdx === 2 && SUIT_SYMBOLS.C}
                        {fIdx === 3 && SUIT_SYMBOLS.S}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

          </div>

          {/* PLAYGROUND BOTTOM ROW: 7 Tableau Columns */}
          <div className="grid grid-cols-7 gap-1 mt-1 justify-items-center">
            {tableaus.map((col, colIdx) => {
              return (
                <div key={colIdx} className="w-[48px] min-h-[220px] flex flex-col relative">
                  
                  {/* Empty target column bracket */}
                  {col.length === 0 && (
                    <div 
                      onClick={() => {
                        if (selectedPileIndex !== -1) {
                          attemptMoveToTableau(colIdx);
                        }
                      }}
                      className="w-[48px] h-[68px] border-2 border-dashed border-green-800 rounded bg-black/10 hover:bg-black/20 cursor-pointer flex items-center justify-center"
                    >
                      <span className="text-green-800/60 font-mono text-[9px] font-bold uppercase">K Only</span>
                    </div>
                  )}

                  {/* Render overlapping column cards stack */}
                  {col.map((card, cardIdx) => {
                    const isSelected = selectedPileType === 'tableau' && selectedPileIndex === colIdx && cardIdx === selectedCardIndex;
                    const offsetTop = cardIdx * 14; // pixels overlapping downward factor

                    return (
                      <div
                        key={card.id}
                        onClick={() => handleCardClick('tableau', colIdx, cardIdx)}
                        onDoubleClick={() => {
                          if (cardIdx === col.length - 1) {
                            handleCardDoubleClick(card, 'tableau', colIdx);
                          }
                        }}
                        style={{ 
                          top: `${offsetTop}px`, 
                          zIndex: cardIdx + 10 
                        }}
                        className={`absolute w-[48px] h-[68px] rounded border-2 shadow-sm transition-transform duration-75 select-none
                          ${card.isFaceUp 
                            ? isSelected 
                              ? 'border-yellow-400 ring-2 ring-yellow-400 bg-yellow-100 brightness-105 transform translate-y-[-2px]' 
                              : 'border-black bg-white hover:brightness-105 cursor-pointer' 
                            : 'border-white cursor-pointer hover:brightness-110'
                          }`}
                      >
                        {card.isFaceUp ? (
                          // Face Up Visual Structure
                          <div className="w-full h-full p-1 flex flex-col justify-between h-full bg-white rounded-sm text-black relative">
                            
                            {/* Standard details */}
                            <div className="flex justify-between leading-none items-center">
                              <span className={`font-bold font-mono text-[10px] ${SUIT_COLORS[card.suit]}`}>
                                {CARD_LABELS[card.value]}
                              </span>
                              <span className={`text-[10px] ${SUIT_COLORS[card.suit]}`}>
                                {SUIT_SYMBOLS[card.suit]}
                              </span>
                            </div>

                            {/* Center decal */}
                            <div className={`text-center text-base self-center leading-none ${SUIT_COLORS[card.suit]}`}>
                              {SUIT_SYMBOLS[card.suit]}
                            </div>

                            <div className="flex justify-end leading-none">
                              <span className={`font-bold text-[9px] ${SUIT_COLORS[card.suit]}`}>
                                {CARD_LABELS[card.value]}
                              </span>
                            </div>

                          </div>
                        ) : (
                          // Face down visual style decal
                          <CardBackVisual style={cardBack} />
                        )}
                      </div>
                    );
                  })}

                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Small informative gameplay footer */}
      <div className="bg-[#A0A0A0]/20 p-1 flex justify-between items-center text-[9px] font-sans text-gray-300 border-t border-green-800">
        <span className="flex items-center gap-1">
          <HelpCircle size={10} />
          Double-click top card to auto-Foundation.
        </span>
        <span>Windows v3.11 Solitaire Companion</span>
      </div>

    </div>
  );
}

// Retro themes for card backs using pixel elements
function CardBackVisual({ style }: { style: CardBackStyle }) {
  if (style === 'sunset-palm') {
    return (
      <div className="w-full h-full bg-[#ff7b00] p-0.5 border border-black rounded-sm flex flex-col justify-between overflow-hidden">
        <div className="w-full h-full bg-[#2a0845] relative flex flex-col items-center justify-center">
          {/* Sunset sun */}
          <div className="w-6 h-6 rounded-full bg-yellow-300 absolute top-5 animate-pulse" />
          {/* Mini pixel palm */}
          <span className="text-xs z-10">🌴</span>
          <div className="absolute bottom-0 w-full h-2 bg-[#ff007f]/40" />
        </div>
      </div>
    );
  }

  if (style === 'castle') {
    return (
      <div className="w-full h-full bg-[#111122] p-0.5 border border-black rounded-sm flex flex-col justify-between overflow-hidden">
        <div className="w-full h-full bg-[#000000] relative flex flex-col items-center justify-center">
          <div className="text-[14px]">🏰</div>
          <span className="text-[7px] text-red-500 font-bold absolute bottom-1">SPOOKY</span>
          <div className="absolute top-1 right-1 text-[7px] text-yellow-100">🦇</div>
        </div>
      </div>
    );
  }

  if (style === 'rainbow-neon') {
    return (
      <div className="w-full h-full bg-black p-0.5 border border-black rounded-sm flex flex-col justify-between overflow-hidden">
        <div className="w-full h-full relative flex flex-col gap-[3px] bg-gradient-to-b from-red-500 via-yellow-400 via-green-400 to-blue-500 p-1 justify-center items-center">
          <span className="text-white text-[18px] opacity-70 font-bold">★</span>
        </div>
      </div>
    );
  }

  // default blue maze design
  return (
    <div className="w-full h-full bg-[#000080] p-0.5 border border-black rounded-sm flex flex-col justify-between overflow-hidden">
      <div className="w-full h-full bg-gradient-to-br from-[#0000FF] to-[#000050] text-[#00FFFF] flex items-center justify-center relative">
        <div className="pat-checkers absolute inset-0 opacity-40" />
        <span className="font-bold text-xs select-none tracking-widest absolute">🌀</span>
      </div>
    </div>
  );
}
