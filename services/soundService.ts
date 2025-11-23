export type SoundType = 'start' | 'pause' | 'break' | 'complete';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-1
}

class SoundService {
  private audioContext: AudioContext | null = null;
  private settings: SoundSettings = {
    enabled: true,
    volume: 0.5
  };

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('focusflow_sound_settings');
      if (saved) {
        this.settings = JSON.parse(saved);
        if (!this.settings.enabled) {
          this.settings.enabled = true;
          this.saveSettings();
        }
      }
    } catch (e) {
      console.error('Error loading sound settings', e);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('focusflow_sound_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.error('Error saving sound settings', e);
    }
  }

  updateSettings(settings: Partial<SoundSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
  }

  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  /**
   * Reproduce un sonido usando Web Audio API
   */
  playSound(type: SoundType, volumeOverride?: number): void {
    if (!this.settings.enabled || typeof window === 'undefined') return;

    try {
      const volume = volumeOverride ?? this.settings.volume;

      // Crear AudioContext si no existe
      if (!this.audioContext) {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          console.warn('Web Audio API no está disponible en este navegador');
          return;
        }
        this.audioContext = new AudioCtx();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Crear nodos de audio
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Configurar volumen
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01);

      // Configurar frecuencias y duraciones según el tipo de sonido
      switch (type) {
        case 'start':
          // Sonido de inicio: tono ascendente optimista
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(523.25, now); // C5
          oscillator.frequency.linearRampToValueAtTime(659.25, now + 0.1); // E5
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          oscillator.stop(now + 0.15);
          break;

        case 'pause':
          // Sonido de pausa: tono descendente suave
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(659.25, now); // E5
          oscillator.frequency.linearRampToValueAtTime(523.25, now + 0.1); // C5
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          oscillator.stop(now + 0.12);
          break;

        case 'break':
          // Sonido de descanso: secuencia armónica relajante
          this.playBreakSound(ctx, now, volume);
          return; // Ya maneja su propio cleanup

        case 'complete':
          // Sonido de completar: melodía de logro
          this.playCompleteSound(ctx, now, volume);
          return; // Ya maneja su propio cleanup
      }

      oscillator.start(now);
    } catch (error) {
      console.error('Error reproduciendo sonido', error);
    }
  }

  private playBreakSound(ctx: AudioContext, startTime: number, volume: number): void {
    // Secuencia armónica para tiempo de descanso
    const notes = [
      { freq: 523.25, start: 0, duration: 0.15 },      // C5
      { freq: 659.25, start: 0.08, duration: 0.15 },   // E5
      { freq: 783.99, start: 0.16, duration: 0.2 }     // G5
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, startTime + note.start);
      
      gain.gain.setValueAtTime(0, startTime + note.start);
      gain.gain.linearRampToValueAtTime(volume * 0.25, startTime + note.start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.start + note.duration);
      
      osc.start(startTime + note.start);
      osc.stop(startTime + note.start + note.duration);
    });
  }

  private playCompleteSound(ctx: AudioContext, startTime: number, volume: number): void {
    // Melodía de éxito/logro
    const notes = [
      { freq: 523.25, start: 0, duration: 0.1 },       // C5
      { freq: 659.25, start: 0.1, duration: 0.1 },     // E5
      { freq: 783.99, start: 0.2, duration: 0.1 },     // G5
      { freq: 1046.50, start: 0.3, duration: 0.25 }    // C6
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, startTime + note.start);
      
      gain.gain.setValueAtTime(0, startTime + note.start);
      gain.gain.linearRampToValueAtTime(volume * 0.3, startTime + note.start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.start + note.duration);
      
      osc.start(startTime + note.start);
      osc.stop(startTime + note.start + note.duration);
    });
  }

  /**
   * Limpia los recursos de audio
   */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Exportar instancia singleton
export const soundService = new SoundService();
