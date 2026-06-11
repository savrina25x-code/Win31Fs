/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume context if suspended (common browser policy)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  getMutedState() {
    return this.isMuted;
  }

  playBeep(freq = 440, duration = 0.1, type: OscillatorType = 'square') {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  playError() {
    this.playBeep(150, 0.25, 'triangle');
  }

  playTick() {
    this.playBeep(800, 0.03, 'sine');
  }

  playExplosion() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Simulate retro noise with custom oscillator slides
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.warn('Explosion sound failed', e);
    }
  }

  playStartup() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Play a vintage synth chiptune arpeggio! (C-E-G-C ascending quickly)
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch (e) {
      console.warn('Startup sound failed', e);
    }
  }

  playWin() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Triumphant win melody!
      const now = ctx.currentTime;
      const notes = [523.25, 523.25, 523.25, 523.25, 659.25, 587.33, 659.25, 783.99, 1046.50];
      const durations = [0.1, 0.1, 0.1, 0.2, 0.2, 0.1, 0.1, 0.1, 0.4];
      const deltas = [0, 0.12, 0.24, 0.36, 0.56, 0.76, 0.88, 1.0, 1.12];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + deltas[idx]);

        gain.gain.setValueAtTime(0.05, now + deltas[idx]);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + deltas[idx] + durations[idx]);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + deltas[idx]);
        osc.stop(now + deltas[idx] + durations[idx] + 0.05);
      });
    } catch (e) {
      console.warn('Win melody failed', e);
    }
  }
}

export const sounds = new SoundEffects();
