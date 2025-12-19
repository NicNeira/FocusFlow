/**
 * Picture-in-Picture Service
 * Manages Document Picture-in-Picture API for timer display
 */

// Extend Window interface for Document PiP API
declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: {
        width?: number;
        height?: number;
        disallowReturnToOpener?: boolean;
      }) => Promise<Window>;
      window: Window | null;
    };
  }

  interface DocumentPictureInPictureEvent extends Event {
    window: Window;
  }
}

export interface PiPConfig {
  width?: number;
  height?: number;
}

export interface PiPState {
  isSupported: boolean;
  isActive: boolean;
  pipWindow: Window | null;
}

const DEFAULT_CONFIG: PiPConfig = {
  width: 400,
  height: 140,
};

// PiP Window styles - inline CSS for the PiP window
const PIP_STYLES = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Outfit', system-ui, sans-serif;
    background: linear-gradient(135deg, #0a0a0f 0%, #12121a 100%);
    color: #e4e4e7;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 16px;
    overflow: hidden;
    user-select: none;
  }

  .pip-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    gap: 16px;
  }

  .pip-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .pip-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: #71717a;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .pip-header svg {
    width: 12px;
    height: 12px;
    color: #00f5ff;
  }

  .pip-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 42px;
    font-weight: 600;
    color: #e4e4e7;
    text-shadow: 0 0 30px rgba(0, 245, 255, 0.3);
    line-height: 1;
    letter-spacing: -2px;
  }

  .pip-time.break-mode {
    color: #00ff88;
    text-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
  }

  .pip-status {
    font-size: 11px;
    color: #a1a1aa;
    font-weight: 500;
    margin-top: 2px;
  }

  .pip-status.work {
    color: #00f5ff;
  }

  .pip-status.break {
    color: #00ff88;
  }

  .pip-right {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
  }

  .pip-controls-row {
    display: flex;
    gap: 6px;
  }

  .pip-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .pip-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
  }

  .pip-btn:active {
    transform: scale(0.95);
  }

  .pip-btn svg {
    width: 16px;
    height: 16px;
  }

  .pip-btn.play {
    background: #00f5ff;
    border-color: #00f5ff;
    box-shadow: 0 0 15px rgba(0, 245, 255, 0.4);
  }

  .pip-btn.play svg {
    color: #0a0a0f;
  }

  .pip-btn.play:hover {
    background: #00c4cc;
    box-shadow: 0 0 20px rgba(0, 245, 255, 0.6);
  }

  .pip-btn.pause {
    background: #fbbf24;
    border-color: #fbbf24;
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.4);
  }

  .pip-btn.pause svg {
    color: #0a0a0f;
  }

  .pip-btn.pause:hover {
    background: #f59e0b;
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
  }

  .pip-btn.save {
    background: #00ff88;
    border-color: #00ff88;
    box-shadow: 0 0 15px rgba(0, 255, 136, 0.4);
  }

  .pip-btn.save svg {
    color: #0a0a0f;
  }

  .pip-btn.save:hover {
    background: #00cc6a;
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.6);
  }

  .pip-btn.stop {
    background: transparent;
    border-color: #ef4444;
  }

  .pip-btn.stop svg {
    color: #ef4444;
  }

  .pip-btn.stop:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  @keyframes pulse-glow {
    0%, 100% {
      text-shadow: 0 0 30px rgba(0, 245, 255, 0.3);
    }
    50% {
      text-shadow: 0 0 50px rgba(0, 245, 255, 0.5);
    }
  }

  .pip-time.running {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .pip-time.running.break-mode {
    animation-name: pulse-glow-green;
  }

  @keyframes pulse-glow-green {
    0%, 100% {
      text-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
    }
    50% {
      text-shadow: 0 0 50px rgba(0, 255, 136, 0.5);
    }
  }
`;

// SVG Icons
const ICONS = {
  timer: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  play: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  stop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
  save: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
};

class PiPService {
  private pipWindow: Window | null = null;
  private onCloseCallback: (() => void) | null = null;
  private updateInterval: number | null = null;

  /**
   * Check if Document Picture-in-Picture API is supported
   */
  isSupported(): boolean {
    return 'documentPictureInPicture' in window;
  }

  /**
   * Check if PiP window is currently active
   */
  isActive(): boolean {
    return this.pipWindow !== null && !this.pipWindow.closed;
  }

  /**
   * Get current PiP window reference
   */
  getWindow(): Window | null {
    return this.pipWindow;
  }

  /**
   * Open Picture-in-Picture window
   */
  async open(config: PiPConfig = {}): Promise<Window | null> {
    if (!this.isSupported()) {
      console.warn('Document Picture-in-Picture API is not supported');
      return null;
    }

    // Close existing PiP if open
    if (this.isActive()) {
      this.close();
    }

    try {
      const finalConfig = { ...DEFAULT_CONFIG, ...config };

      this.pipWindow = await window.documentPictureInPicture!.requestWindow({
        width: finalConfig.width,
        height: finalConfig.height,
        disallowReturnToOpener: false,
      });

      // Setup the PiP window
      this.setupPiPWindow();

      // Listen for window close
      this.pipWindow.addEventListener('pagehide', () => {
        this.handleClose();
      });

      return this.pipWindow;
    } catch (error) {
      console.error('Failed to open PiP window:', error);
      return null;
    }
  }

  /**
   * Setup the PiP window with base HTML and styles
   */
  private setupPiPWindow(): void {
    if (!this.pipWindow) return;

    const doc = this.pipWindow.document;

    // Add styles
    const style = doc.createElement('style');
    style.textContent = PIP_STYLES;
    doc.head.appendChild(style);

    // Set initial HTML structure - horizontal layout
    doc.body.innerHTML = `
      <div class="pip-container">
        <div class="pip-left">
          <div class="pip-header">
            ${ICONS.timer}
            <span>FocusFlow</span>
          </div>
          <div class="pip-time" id="pip-time">00:00:00</div>
          <div class="pip-status" id="pip-status">Pausado</div>
        </div>
        <div class="pip-right">
          <div class="pip-controls-row">
            <button class="pip-btn play" id="pip-play" title="Iniciar">
              ${ICONS.play}
            </button>
            <button class="pip-btn pause" id="pip-pause" title="Pausar" style="display: none;">
              ${ICONS.pause}
            </button>
            <button class="pip-btn save" id="pip-save" title="Guardar" style="display: none;">
              ${ICONS.save}
            </button>
          </div>
          <div class="pip-controls-row">
            <button class="pip-btn stop" id="pip-stop" title="Reiniciar" style="display: none;">
              ${ICONS.stop}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update the PiP display with current timer state
   */
  updateDisplay(data: {
    time: string;
    isRunning: boolean;
    isBreakTime?: boolean;
    status?: string;
    hasElapsedTime?: boolean;
  }): void {
    if (!this.pipWindow || this.pipWindow.closed) return;

    const doc = this.pipWindow.document;

    // Update time
    const timeEl = doc.getElementById('pip-time');
    if (timeEl) {
      timeEl.textContent = data.time;
      timeEl.classList.toggle('running', data.isRunning);
      timeEl.classList.toggle('break-mode', data.isBreakTime || false);
    }

    // Update status
    const statusEl = doc.getElementById('pip-status');
    if (statusEl) {
      statusEl.textContent = data.status || (data.isRunning ? 'En progreso' : 'Pausado');
      statusEl.className = 'pip-status';
      if (data.isBreakTime) {
        statusEl.classList.add('break');
      } else if (data.isRunning) {
        statusEl.classList.add('work');
      }
    }

    // Update buttons visibility
    const playBtn = doc.getElementById('pip-play');
    const pauseBtn = doc.getElementById('pip-pause');
    const saveBtn = doc.getElementById('pip-save');
    const stopBtn = doc.getElementById('pip-stop');

    if (playBtn && pauseBtn) {
      playBtn.style.display = data.isRunning ? 'none' : 'flex';
      pauseBtn.style.display = data.isRunning ? 'flex' : 'none';
    }

    // Show save and stop buttons when paused with elapsed time
    const showSecondaryButtons = !data.isRunning && data.hasElapsedTime;
    if (saveBtn) {
      saveBtn.style.display = showSecondaryButtons ? 'flex' : 'none';
    }
    if (stopBtn) {
      stopBtn.style.display = showSecondaryButtons ? 'flex' : 'none';
    }
  }

  /**
   * Set up button click handlers
   */
  setupControls(handlers: {
    onPlay: () => void;
    onPause: () => void;
    onStop?: () => void;
    onSave?: () => void;
  }): void {
    if (!this.pipWindow || this.pipWindow.closed) return;

    const doc = this.pipWindow.document;

    const playBtn = doc.getElementById('pip-play');
    const pauseBtn = doc.getElementById('pip-pause');
    const stopBtn = doc.getElementById('pip-stop');
    const saveBtn = doc.getElementById('pip-save');

    if (playBtn) {
      playBtn.onclick = () => handlers.onPlay();
    }

    if (pauseBtn) {
      pauseBtn.onclick = () => handlers.onPause();
    }

    if (stopBtn && handlers.onStop) {
      stopBtn.onclick = () => handlers.onStop!();
    }

    if (saveBtn && handlers.onSave) {
      saveBtn.onclick = () => handlers.onSave!();
    }
  }

  /**
   * Set callback for when PiP window is closed
   */
  onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  /**
   * Handle PiP window close
   */
  private handleClose(): void {
    this.pipWindow = null;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  /**
   * Close the PiP window
   */
  close(): void {
    if (this.pipWindow && !this.pipWindow.closed) {
      this.pipWindow.close();
    }
    this.handleClose();
  }

  /**
   * Destroy the service and clean up
   */
  destroy(): void {
    this.close();
    this.onCloseCallback = null;
  }
}

// Export singleton instance
export const pipService = new PiPService();

// Export class for testing
export { PiPService };
