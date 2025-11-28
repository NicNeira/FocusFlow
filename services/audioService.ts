// Servicio para gestionar reproducción de sonidos y alertas de audio

export type SoundType = 'work-end' | 'break-end' | 'cycle-complete' | 'achievement';

interface AudioSettings {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
}

class AudioService {
  private static instance: AudioService;
  private audioContext: AudioContext | null = null;
  private settings: AudioSettings = {
    enabled: true,
    volume: 0.5,
  };
  private soundCache: Map<SoundType, HTMLAudioElement> = new Map();

  private constructor() {
    this.initializeAudioContext();
    this.preloadSounds();
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * Inicializa el contexto de audio para Web Audio API
   */
  private initializeAudioContext(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.warn('Web Audio API no soportada:', error);
    }
  }

  /**
   * Precarga los sonidos en memoria para reproducción instantánea
   */
  private preloadSounds(): void {
    const sounds: SoundType[] = ['work-end', 'break-end', 'cycle-complete', 'achievement'];

    sounds.forEach((soundType) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = `/sounds/${soundType}.mp3`;

      // Silenciar errores si el archivo no existe (usaremos fallback)
      audio.addEventListener('error', () => {
        console.log(`Archivo de sonido ${soundType}.mp3 no encontrado, usando fallback`);
      });

      this.soundCache.set(soundType, audio);
    });
  }

  /**
   * Reproduce un tono generado programáticamente (fallback)
   */
  private playGeneratedTone(type: SoundType): void {
    if (!this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configurar frecuencias según el tipo
      let frequencies: number[] = [];
      let durations: number[] = [];

      switch (type) {
        case 'work-end':
          // Tono ascendente suave
          frequencies = [440, 554.37]; // A4 -> C#5
          durations = [0.2, 0.3];
          break;
        case 'break-end':
          // Tono doble
          frequencies = [523.25, 523.25]; // C5 -> C5
          durations = [0.15, 0.15];
          break;
        case 'cycle-complete':
          // Tono de éxito (3 notas ascendentes)
          frequencies = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5
          durations = [0.15, 0.15, 0.3];
          break;
        case 'achievement':
          // Tono especial de logro
          frequencies = [659.25, 783.99, 1046.50]; // E5 -> G5 -> C6
          durations = [0.1, 0.1, 0.4];
          break;
      }

      let currentTime = now;
      frequencies.forEach((freq, index) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext!.destination);

        osc.frequency.value = freq;
        osc.type = 'sine';

        // Envelope ADSR suave
        gain.gain.setValueAtTime(0, currentTime);
        gain.gain.linearRampToValueAtTime(this.settings.volume * 0.3, currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(this.settings.volume * 0.2, currentTime + durations[index] - 0.05);
        gain.gain.linearRampToValueAtTime(0, currentTime + durations[index]);

        osc.start(currentTime);
        osc.stop(currentTime + durations[index]);

        currentTime += durations[index] + 0.05;
      });
    } catch (error) {
      console.error('Error al reproducir tono:', error);
    }
  }

  /**
   * Reproduce un sonido del tipo especificado
   */
  public async play(type: SoundType): Promise<void> {
    if (!this.settings.enabled) {
      return;
    }

    const audio = this.soundCache.get(type);

    if (audio && audio.readyState >= 2) {
      // El archivo de audio está disponible y cargado
      try {
        audio.volume = this.settings.volume;
        audio.currentTime = 0;
        await audio.play();
      } catch (error) {
        // Fallback a tono generado si falla la reproducción
        console.log('Usando tono generado como fallback');
        this.playGeneratedTone(type);
      }
    } else {
      // Usar tono generado si no hay archivo
      this.playGeneratedTone(type);
    }
  }

  /**
   * Reproduce el sonido de fin de trabajo
   */
  public async playWorkEnd(): Promise<void> {
    await this.play('work-end');
  }

  /**
   * Reproduce el sonido de fin de descanso
   */
  public async playBreakEnd(): Promise<void> {
    await this.play('break-end');
  }

  /**
   * Reproduce el sonido de ciclo completado
   */
  public async playCycleComplete(): Promise<void> {
    await this.play('cycle-complete');
  }

  /**
   * Reproduce el sonido de logro
   */
  public async playAchievement(): Promise<void> {
    await this.play('achievement');
  }

  /**
   * Activa o desactiva el sonido
   */
  public setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  /**
   * Verifica si el sonido está activado
   */
  public isEnabled(): boolean {
    return this.settings.enabled;
  }

  /**
   * Establece el volumen (0.0 a 1.0)
   */
  public setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  /**
   * Obtiene el volumen actual
   */
  public getVolume(): number {
    return this.settings.volume;
  }

  /**
   * Obtiene la configuración actual
   */
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Guarda la configuración en localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('focusflow_audio_settings_v1', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error al guardar configuración de audio:', error);
    }
  }

  /**
   * Carga la configuración desde localStorage
   */
  public loadSettings(): void {
    try {
      const saved = localStorage.getItem('focusflow_audio_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = {
          enabled: parsed.enabled ?? true,
          volume: parsed.volume ?? 0.5,
        };
      }
    } catch (error) {
      console.error('Error al cargar configuración de audio:', error);
    }
  }

  /**
   * Vibra el dispositivo si es compatible
   */
  public vibrate(pattern: number | number[]): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.log('Vibración no soportada');
      }
    }
  }
}

// Exportar instancia singleton
export const audioService = AudioService.getInstance();

// Cargar configuración al iniciar
audioService.loadSettings();
