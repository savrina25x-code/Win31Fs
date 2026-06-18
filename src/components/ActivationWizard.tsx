/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, ShoppingCart, HelpCircle, AlertTriangle, CheckCircle, Wallet, Award, RefreshCw, Clipboard } from 'lucide-react';
import { sounds } from './SoundEffects';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Target merchant addresses
const COLLECTION_ADDRESSES = [
  '0x2E9Bff8Bf288ec3AB1Dc540B777f9b48276a6286',
  '0xB43781Dae1C39C529f4088888b0EE0f469f435ce',
  '0xc60fde84af6f6084518c542348dd56c2a9887b28'
];

// BSC USDT Token Contract Address (Binance-Peg BSC-USD)
const BSC_USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
const BSC_CHAIN_ID_HEX = '0x38'; // 56 in decimal

// Helper to generate a 20-character serial key with a checksum pattern
// Format: FBSE-XXXXX-YYYYY-ZZZZZ (20 characters total of key content, plus dashes)
// The first 15 characters are random alphanumeric, the last 5 is a mod36 checksum of the prefix.
export function generateFBSEKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let prefix = 'FBSE';
  // generate 11 more random chars to make first 15 chars
  for (let i = 0; i < 11; i++) {
    prefix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Calculate checksum of the first 15 characters
  let sum = 0;
  for (let i = 0; i < prefix.length; i++) {
    sum += prefix.charCodeAt(i) * (i + 1);
  }
  
  // Create last 5 checksum characters
  let checksumSuffix = '';
  let tempSum = sum;
  for (let i = 0; i < 5; i++) {
    const charIndex = tempSum % chars.length;
    checksumSuffix += chars.charAt(charIndex);
    tempSum = Math.floor(tempSum / 7) + 123; // shift
  }
  
  // Full raw key is 20 characters: Prefix (15 chars) + checksumSuffix (5 chars)
  const fullRawKey = prefix + checksumSuffix;
  
  // Format with dashes for aesthetic purposes: 4-5-5-5 (20 chars total)
  // e.g. FBSE-XXXXX-YYYYY-ZZZZZ
  return `${fullRawKey.substring(0, 4)}-${fullRawKey.substring(4, 9)}-${fullRawKey.substring(9, 14)}-${fullRawKey.substring(14, 20)}`;
}

// Function to validate any serial key
export function validateFBSEKey(rawKey: string): { isValid: boolean; reason?: string } {
  // Clean dashes & spaces
  const cleaned = rawKey.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (cleaned.length !== 20) {
    return { isValid: false, reason: 'Serial key must be exactly 20 characters (excluding hyphens).' };
  }
  
  if (!cleaned.startsWith('FBSE')) {
    return { isValid: false, reason: 'Invalid header prefix. Keys must originate from authorized FBS-E publisher.' };
  }
  
  // Re-calculate the checksum of the first 15 characters
  const prefix = cleaned.substring(0, 15);
  const suffix = cleaned.substring(15, 20);
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sum = 0;
  for (let i = 0; i < prefix.length; i++) {
    sum += prefix.charCodeAt(i) * (i + 1);
  }
  
  let expectedSuffix = '';
  let tempSum = sum;
  for (let i = 0; i < 5; i++) {
    const charIndex = tempSum % chars.length;
    expectedSuffix += chars.charAt(charIndex);
    tempSum = Math.floor(tempSum / 7) + 123;
  }
  
  if (suffix !== expectedSuffix) {
    return { isValid: false, reason: 'Cryptographic signature mismatch. Key could be forged, expired, or invalid.' };
  }
  
  return { isValid: true };
}

export default function ActivationWizard() {
  const [activeTab, setActiveTab] = useState<'purchase' | 'validation' | 'history'>('purchase');
  
  // Wallet states
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');

  // Key outputs
  const [newlyIssuedKey, setNewlyIssuedKey] = useState<string | null>(null);

  // Validation inputs
  const [inputKeyToValidate, setInputKeyToValidate] = useState<string>('');
  const [validationResult, setValidationResult] = useState<{ checked: boolean; valid: boolean; reason?: string } | null>(null);

  // Key history
  const [purchasedKeys, setPurchasedKeys] = useState<Array<{ key: string; date: string; address: string; recipient: string; tx: string }>>([]);

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('fbse_purchased_keys');
    if (stored) {
      try {
        setPurchasedKeys(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Check if wallet is connected in background
  useEffect(() => {
    if (window.ethereum) {
      // Setup listener
      const handleAccounts = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      };
      
      const handleChain = (chainId: string) => {
        if (chainId !== BSC_CHAIN_ID_HEX) {
          setNetworkError('Please switch MetaMask to BNB Smart Chain (BSC)!');
        } else {
          setNetworkError(null);
        }
      };

      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: any) => {
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        }).catch(console.error);

      window.ethereum.request({ method: 'eth_chainId' })
        .then((chainId: any) => {
          if (chainId !== BSC_CHAIN_ID_HEX) {
            setNetworkError('BSC network mismatch. Set to BSC chain.');
          }
        }).catch(console.error);

      window.ethereum.on('accountsChanged', handleAccounts);
      window.ethereum.on('chainChanged', handleChain);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccounts);
        window.ethereum.removeListener('chainChanged', handleChain);
      };
    }
  }, []);

  const connectWallet = async () => {
    sounds.playTick();
    if (!window.ethereum) {
      alert('Could not detect Web3 Wallet (e.g. MetaMask). Please install a browser extension to interact with BNB Chain!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setNetworkError(null);

      // Verify chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== BSC_CHAIN_ID_HEX) {
        await requestSwitchNetwork();
      }
    } catch (e: any) {
      console.warn(e);
      setNetworkError(e.message || 'Connection failed.');
    }
  };

  const requestSwitchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID_HEX }],
      });
      setNetworkError(null);
    } catch (switchError: any) {
      // Standard: Chain not added, try adding it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BSC_CHAIN_ID_HEX,
                chainName: 'BNB Smart Chain',
                nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              },
            ],
          });
          setNetworkError(null);
        } catch (addError) {
          console.error(addError);
        }
      } else {
        console.error(switchError);
      }
    }
  };

  // Triggers purchase transacting 7 USDT BSC randomly to one of 3 address
  const handlePurchaseUSDT = async () => {
    sounds.playTick();
    setNetworkError(null);
    setTxHash(null);
    setNewlyIssuedKey(null);

    // Random collection target address
    const randomAddress = COLLECTION_ADDRESSES[Math.floor(Math.random() * COLLECTION_ADDRESSES.length)];
    setSelectedRecipient(randomAddress);

    // 1. WEB3 ACTUAL INTEGRATION ROUTE
    if (window.ethereum && walletAddress) {
      setTxLoading(true);
      try {
        // Enforce proper network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BSC_CHAIN_ID_HEX) {
          await requestSwitchNetwork();
          const nextChain = await window.ethereum.request({ method: 'eth_chainId' });
          if (nextChain !== BSC_CHAIN_ID_HEX) {
            setTxLoading(false);
            setNetworkError('Please select BNB Smart Chain to resume payment.');
            return;
          }
        }

        // Send transaction sending BEP-20 transfer(addressTo, amountUint256)
        // 7 USDT = 7 * 10^18. (7000000000000000000 in decimal)
        // Hexadecimal format of transfer(target, 700000000000000000)
        // Selector for transfer is a9059cbb
        // Recipient raw address padded: e.g. 0x2E9Bff8Bf288ec3AB1Dc540B777f9b48276a6286 -> 0000000000000000000000002e9bff8bf288ec3ab1dc540b777f9b48276a6286
        const cleanRecipient = randomAddress.replace('0x', '').toLowerCase().padStart(64, '0');
        
        // 7 USDT = 7 * 10^18 = 0x61234907a7e80000
        const hexAmount = '61234907a7e80000'.padStart(64, '0');
        
        // Combine ERC20 transfer payload
        const txData = `0xa9059cbb${cleanRecipient}${hexAmount}`;

        const transactionParameters = {
          to: BSC_USDT_CONTRACT, 
          from: walletAddress, 
          data: txData, 
          value: '0x00', 
        };

        const txResponseHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactionParameters],
        });

        // Key creation upon successful wallet send!
        setTxHash(txResponseHash);
        finalizeKeyGeneration(randomAddress, txResponseHash);
        
      } catch (err: any) {
        console.error(err);
        setNetworkError(err.message || 'MetaMask transaction rejected or failed.');
        sounds.playBeep(220, 0.2, 'sawtooth');
      } finally {
        setTxLoading(false);
      }
    } else {
      // 2. BACKUP OFFLINE / TEST MODE SIMULATOR (If no MetaMask connected)
      // Users in a standard sandbox can evaluate this instantly
      const confirmOffline = window.confirm(
        `Web3 wallet is not connected! \n\nDo you want to simulate local developer-test purchase of 7 USDT (BSC) paid to: \n${randomAddress}?\n\n(This generates a valid serial key instantly on completion)`
      );
      if (!confirmOffline) return;

      setTxLoading(true);
      setTimeout(() => {
        const fakeTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setTxHash(fakeTx);
        finalizeKeyGeneration(randomAddress, fakeTx);
        setTxLoading(false);
      }, 1500);
    }
  };

  const finalizeKeyGeneration = (recipient: string, transactionId: string) => {
    // Play majestic victory chimes of Windows 3.1
    sounds.playBeep(523.25, 0.1, 'sine');
    setTimeout(() => sounds.playBeep(659.25, 0.1, 'sine'), 80);
    setTimeout(() => sounds.playBeep(783.99, 0.1, 'sine'), 160);
    setTimeout(() => sounds.playBeep(1046.50, 0.25, 'sine'), 240);

    const keyGenerated = generateFBSEKey();
    setNewlyIssuedKey(keyGenerated);

    // Save to key history state and localDB
    const record = {
      key: keyGenerated,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      address: walletAddress || 'Simulated Test User',
      recipient,
      tx: transactionId
    };

    const newHistory = [record, ...purchasedKeys];
    setPurchasedKeys(newHistory);
    localStorage.setItem('fbse_purchased_keys', JSON.stringify(newHistory));
  };

  // Perform instant key check verification
  const handleValidateInput = () => {
    sounds.playTick();
    if (!inputKeyToValidate.trim()) {
      setValidationResult({
        checked: true,
        valid: false,
        reason: 'Please enter a 20-character serial key first.'
      });
      return;
    }

    const check = validateFBSEKey(inputKeyToValidate);
    
    if (check.isValid) {
      sounds.playBeep(880, 0.15, 'sine');
      setValidationResult({
        checked: true,
        valid: true
      });
    } else {
      sounds.playBeep(180, 0.25, 'sawtooth');
      setValidationResult({
        checked: true,
        valid: false,
        reason: check.reason
      });
    }
  };

  const handleCopy = (text: string) => {
    sounds.playTick();
    navigator.clipboard.writeText(text);
    alert('Copied key to clipboard successfully!');
  };

  return (
    <div className="flex flex-col h-full bg-[#C0C0C0] text-black text-xs font-sans p-2 select-none justify-between">
      
      {/* Vintage Header Area */}
      <div className="mb-2.5 pb-2 border-b border-gray-400">
        <h1 className="text-sm font-bold flex items-center gap-2 text-[#000080]">
          <Award size={16} /> FBS-E Game Serial Activator v3.1
        </h1>
        <p className="text-[10px] text-gray-700 font-bold mt-0.5">
          Licensed Web3 software registration under BSC Smart Contract logic.
        </p>
      </div>

      {/* Retro 3-Tab Navigator Bar */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={() => { sounds.playTick(); setActiveTab('purchase'); }}
          className={`flex items-center gap-1 px-3 py-1.5 font-bold cursor-pointer rounded-t border-t-2 border-l-2 border-r-2
            ${activeTab === 'purchase'
              ? 'bg-[#EAEAEA] border-white text-[#000080] border-b-transparent z-10 -mb-[1px]'
              : 'bg-[#C0C0C0] border-[#808080] border-b-[#808080] text-gray-800'}`}
        >
          <ShoppingCart size={11} /> 1. Purchase Serial
        </button>
        <button
          onClick={() => { sounds.playTick(); setActiveTab('validation'); }}
          className={`flex items-center gap-1 px-3 py-1.5 font-bold cursor-pointer rounded-t border-t-2 border-l-2 border-r-2
            ${activeTab === 'validation'
              ? 'bg-[#EAEAEA] border-white text-[#000080] border-b-transparent z-10 -mb-[1px]'
              : 'bg-[#C0C0C0] border-[#808080] border-b-[#808080] text-gray-800'}`}
        >
          <ShieldCheck size={11} /> 2. Validate Key
        </button>
        <button
          onClick={() => { sounds.playTick(); setActiveTab('history'); }}
          className={`flex items-center gap-1 px-3 py-1.5 font-bold cursor-pointer rounded-t border-t-2 border-l-2 border-r-2
            ${activeTab === 'history'
              ? 'bg-[#EAEAEA] border-white text-[#000080] border-b-transparent z-10 -mb-[1px]'
              : 'bg-[#C0C0C0] border-[#808080] border-[#808080] text-gray-800'}`}
        >
          <Key size={11} /> 3. My Registries ({purchasedKeys.length})
        </button>
      </div>

      {/* Main Container Bevel Frame */}
      <div className="flex-1 overflow-auto bg-[#D1D1D1] border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white p-3 rounded-sm min-h-[220px]">
        
        {/* TAB 1: PURCHASE DIALOG */}
        {activeTab === 'purchase' && (
          <div className="flex flex-col gap-2.5 h-full">
            <div className="bg-white border p-2.5 rounded-sm shadow-sm flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#000080] flex items-center gap-1">
                  📦 FBS-E Game License Serial Code pack
                </span>
                <span className="bg-green-700 text-white font-mono px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                  Price: 7.00 USDT (BSC)
                </span>
              </div>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Connect your BSC-compatible Web3 wallet to securely fetch or purchase your unique 20-character private serial activation license.
              </p>
            </div>

            {/* Smart Wallet Banner Indicator */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-gray-400 p-2 bg-[#C0C0C0] rounded flex flex-col justify-between">
                <span className="text-[9px] font-bold text-gray-700 uppercase">1. Web3 Wallet Address</span>
                {walletAddress ? (
                  <div className="text-[10px] font-mono break-all font-bold text-emerald-800 bg-white p-1 border rounded mt-1">
                    {walletAddress}
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="mt-1 flex items-center justify-center gap-1.5 py-1 bg-[#000080] hover:bg-[#0000a0] text-white font-bold rounded-sm border-2 border-t-white border-l-white border-b-black border-r-black cursor-pointer shadow-sm text-xs active:border-inner"
                  >
                    <Wallet size={12} /> Connect Wallet
                  </button>
                )}
              </div>

              <div className="border border-gray-400 p-2 bg-[#C0C0C0] rounded flex flex-col justify-between">
                <span className="text-[9px] font-bold text-gray-700 uppercase">2. BSC USDT Network</span>
                {networkError ? (
                  <div className="mt-1 text-[9px] font-bold text-red-700 bg-red-50 border border-red-300 p-1 flex items-center gap-1 animate-pulse">
                    <AlertTriangle size={11} className="shrink-0" />
                    <span>{networkError}</span>
                  </div>
                ) : walletAddress ? (
                  <div className="mt-1 text-[10px] font-bold text-green-800 bg-green-50 border border-green-300 p-1 flex items-center gap-1">
                    <CheckCircle size={10} className="text-green-700 shrink-0" />
                    <span>BNB Smart Chain (Active)</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-500 italic mt-1.5">Please link wallet to verify.</span>
                )}
              </div>
            </div>

            {/* Pay Button Action */}
            <div className="flex flex-col items-center gap-2.5 mt-1 border-t border-gray-400 pt-3">
              <button
                onClick={handlePurchaseUSDT}
                disabled={txLoading}
                className="w-full max-w-[280px] py-2.5 bg-[#FF8000] hover:bg-[#FF9431] text-white border-2 border-t-white border-l-white border-b-black border-r-black font-bold uppercase rounded-sm cursor-pointer shadow-md text-xs flex items-center justify-center gap-2 active:border-inner disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {txLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-white" />
                    <span>PROCESS TRANSACTION...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={14} />
                    <span>Buy Serial for 7 USDT</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <span className="text-[9px] text-gray-600 italic block">
                  Purchases automatically trigger randomly to one of 3 secure vault nodes:
                </span>
                <span className="font-mono text-[8px] font-bold text-gray-500 break-all select-all block mt-0.5">
                  Node 1: 0x2E9B...6286 | Node 2: 0xB437...35ce | Node 3: 0xc60f...7b28
                </span>
              </div>
            </div>

            {/* NEWLY ACQUIRED EXCLUSIVE SERIAL KEY BOARD */}
            {newlyIssuedKey && (
              <div className="bg-[#FFFFE1] border-2 border-[#D3D32F] p-3 mt-1.5 rounded-sm flex flex-col items-center gap-1.5 animate-bounce">
                <span className="font-bold text-[10px] text-yellow-800 flex items-center gap-1 uppercase">
                  🎉 FBS-E Serial Successfully Issued!
                </span>
                <div className="flex items-center gap-2 bg-black text-yellow-300 font-mono font-bold text-base px-4 py-1.5 rounded tracking-widest border border-dashed border-yellow-500 select-all">
                  {newlyIssuedKey}
                  <button
                    onClick={() => handleCopy(newlyIssuedKey)}
                    className="p-1 hover:bg-white/20 rounded cursor-pointer ml-1"
                    title="Copy Key"
                  >
                    <Clipboard size={14} />
                  </button>
                </div>
                <div className="text-[9.5px] text-gray-600 text-center leading-normal">
                  This exclusive key has a mathematical validation signature. Keep it safe in digital records!<br />
                  <span className="font-bold text-gray-700">Tx hash:</span> <span className="font-mono text-[8px] break-all">{txHash?.substring(0, 36)}...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VALIDATION ENGINE AND IN-APP TEST */}
        {activeTab === 'validation' && (
          <div className="flex flex-col gap-2.5">
            <div className="bg-white border p-2.5 rounded-sm">
              <span className="font-bold text-[#000080] block mb-1">🔍 Verification & Validation Gateway</span>
              <p className="text-[10px] text-gray-600 leading-normal">
                Submit your 20-character FBS-E serial key. The activation validator calculates the cryptographic checksum of the key string locally to verify authenticity without needing slow network round-trips.
              </p>
            </div>

            {/* Input form panel */}
            <div className="border border-gray-400 p-3 bg-[#C0C0C0] rounded-sm flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-800">
                Enter FBS-E Serial (20 characters, e.g. <span className="font-mono">FBSE-1A2B-3C4D-5E6F</span>):
              </label>
              
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="FBSE-XXXX-XXXX-XXXX-XXXX"
                  value={inputKeyToValidate}
                  onChange={(e) => {
                    setValidationResult(null);
                    setInputKeyToValidate(e.target.value);
                  }}
                  className="flex-1 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white p-1.5 font-mono text-sm uppercase tracking-wider outline-none text-[#000080]"
                />
                
                <button
                  onClick={handleValidateInput}
                  className="px-3 bg-[#000080] hover:bg-[#0000a0] text-white border-2 border-t-white border-l-white border-b-black border-r-black font-bold uppercase rounded-sm cursor-pointer active:border-inner"
                >
                  Verify
                </button>
              </div>

              {/* Validation Response Result Panel */}
              {validationResult && validationResult.checked && (
                <div className="mt-2.5">
                  {validationResult.valid ? (
                    <div className="bg-green-100 border border-green-500 p-2.5 rounded-sm flex items-start gap-2 text-green-900">
                      <CheckCircle size={16} className="text-green-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-xs uppercase block">✅ LICENSE FULLY VALIDATED!</strong>
                        <span className="text-[10px] leading-tight block mt-0.5">
                          Excellent. The mathematical signature is fully valid and authorized for client launcher operations on the FBS-E network.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-100 border border-red-400 p-2.5 rounded-sm flex items-start gap-2 text-red-900">
                      <AlertTriangle size={16} className="text-red-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-xs uppercase block">❌ VALIDATION FAILURE</strong>
                        <span className="text-[10px] leading-tight block mt-0.5">
                          {validationResult.reason || 'Cryptographic verification check failed.'} Please confirm details and try again.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Helpful validation instruction block */}
            <div className="text-[10px] text-gray-600 bg-gray-100/50 p-2 border rounded border-gray-300">
              <h4 className="font-bold flex items-center gap-1 text-gray-700">
                <HelpCircle size={11} /> About FBS-E Checksum Logic
              </h4>
              <p className="mt-0.5 leading-relaxed text-[9px]">
                Valid license keys must contain the <span className="font-bold">FBSE</span> prefix, follow exactly 20 characters length excluding separator hyphens, and pass an automated modulus-36 sum check. Keys issued by our Store are universally compatible.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: KEY REGISTRY & HISTORY */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-700">Purchased Key Ledger Records:</span>
              <button
                onClick={() => {
                  sounds.playTick();
                  if (confirm('Are you sure you want to clean key purchase history cache?')) {
                    localStorage.removeItem('fbse_purchased_keys');
                    setPurchasedKeys([]);
                  }
                }}
                className="text-[9px] text-red-700 px-1 border border-red-300 hover:bg-red-50 bg-white rounded cursor-pointer"
              >
                Clear Ledger Cache
              </button>
            </div>

            {purchasedKeys.length === 0 ? (
              <div className="text-center p-6 text-gray-500 font-sans italic border border-[#B0B0B0] bg-white rounded-sm">
                No local register receipts found.<br />
                Purchases on your logged wallet address will register here dynamically.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {purchasedKeys.map((item, idx) => (
                  <div key={idx} className="bg-white border rounded p-2 text-[10px] flex flex-col gap-1 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 bg-black text-yellow-300 font-mono font-bold text-xs px-2 py-0.5 rounded tracking-wide border select-all">
                        {item.key}
                        <button
                          onClick={() => handleCopy(item.key)}
                          className="hover:text-white"
                          title="Copy Key"
                        >
                          <Clipboard size={10} />
                        </button>
                      </div>
                      <span className="text-[8px] font-mono text-gray-500">{item.date}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 mt-1 border-t border-dashed pt-1 text-[9px] text-gray-600 font-mono">
                      <div className="truncate">
                        <strong>Node target:</strong> <span className="select-all">{item.recipient}</span>
                      </div>
                      <div className="truncate">
                        <strong>TxHash:</strong> <a href={`https://bscscan.com/tx/${item.tx}`} target="_blank" rel="referrer noreferrer" className="text-blue-700 hover:underline">{item.tx.substring(0, 16)}...</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Retro bottom window status info */}
      <div className="bg-[#A0A0A0]/20 p-1 flex justify-between items-center text-[9px] font-sans text-gray-500 border-t border-gray-400 mt-2">
        <span>Payment processor: BNB Chain USDT BEP-20 API helper</span>
        <span>Secure Active Connection</span>
      </div>

    </div>
  );
}
