import { supabase } from './supabaseClient';
import { TimerState } from '../types';
import { getDefaultTimerState } from './supabaseService';

// =============================================
// CONSTANTS
// =============================================

const LOCAL_STORAGE_KEY = 'focusflow_timer_backup_v1';
const DEBOUNCE_DELAY = 1000; // 1 segundo de debounce
const BEACON_ENDPOINT = '/api/timer-sync'; // Para sendBeacon (opcional)

// =============================================
// TYPES
// =============================================

export interface TimerBackup {
  state: TimerState;
  savedAt: number; // timestamp
  userId: string;
}

export interface RestoredTimerInfo {
  state: TimerState;
  wasRunning: boolean;
  elapsedWhileAway: number; // segundos transcurridos mientras la app estaba cerrada
  source: 'supabase' | 'localStorage' | 'none';
}

// =============================================
// LOCAL STORAGE OPERATIONS
// =============================================

/**
 * Guarda el estado del temporizador en localStorage como backup
 */
export const saveTimerBackupToLocal = (userId: string, state: TimerState): void => {
  try {
    const backup: TimerBackup = {
      state,
      savedAt: Date.now(),
      userId,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(backup));
    console.log('💾 [TimerPersistence] Backup guardado en localStorage');
  } catch (error) {
    console.error('Error guardando backup en localStorage:', error);
  }
};

/**
 * Carga el backup del temporizador desde localStorage
 */
export const loadTimerBackupFromLocal = (userId: string): TimerBackup | null => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return null;
    
    const backup: TimerBackup = JSON.parse(data);
    
    // Verificar que el backup pertenece al usuario actual
    if (backup.userId !== userId) {
      console.log('⚠️ [TimerPersistence] Backup de otro usuario, ignorando');
      return null;
    }
    
    return backup;
  } catch (error) {
    console.error('Error cargando backup desde localStorage:', error);
    return null;
  }
};

/**
 * Limpia el backup de localStorage
 */
export const clearTimerBackupFromLocal = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    console.log('🗑️ [TimerPersistence] Backup eliminado de localStorage');
  } catch (error) {
    console.error('Error limpiando backup de localStorage:', error);
  }
};

// =============================================
// SUPABASE OPERATIONS
// =============================================

/**
 * Guarda el estado del temporizador en Supabase
 */
export const saveTimerStateToSupabase = async (
  userId: string,
  state: TimerState
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('timer_state')
      .upsert({
        user_id: userId,
        state: state,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error guardando estado en Supabase:', error);
      return false;
    }

    console.log('☁️ [TimerPersistence] Estado guardado en Supabase');
    return true;
  } catch (error) {
    console.error('Error guardando estado en Supabase:', error);
    return false;
  }
};

/**
 * Carga el estado del temporizador desde Supabase
 */
export const loadTimerStateFromSupabase = async (
  userId: string
): Promise<{ state: TimerState; updatedAt: string } | null> => {
  try {
    const { data, error } = await supabase
      .from('timer_state')
      .select('state, updated_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      console.error('Error cargando estado desde Supabase:', error);
      return null;
    }

    return {
      state: data.state as TimerState,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error cargando estado desde Supabase:', error);
    return null;
  }
};

// =============================================
// DEBOUNCE MECHANISM
// =============================================

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSave: { userId: string; state: TimerState } | null = null;

/**
 * Guarda el estado con debounce para evitar guardados excesivos
 */
export const saveTimerStateDebounced = (
  userId: string,
  state: TimerState,
  immediate = false
): void => {
  pendingSave = { userId, state };

  // Siempre guardar inmediatamente en localStorage
  saveTimerBackupToLocal(userId, state);

  if (immediate) {
    // Cancelar cualquier guardado pendiente y ejecutar inmediatamente
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    saveTimerStateToSupabase(userId, state);
    return;
  }

  // Debounce para Supabase
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    if (pendingSave) {
      saveTimerStateToSupabase(pendingSave.userId, pendingSave.state);
      pendingSave = null;
    }
    debounceTimer = null;
  }, DEBOUNCE_DELAY);
};

/**
 * Fuerza el guardado inmediato de cualquier estado pendiente
 */
export const flushPendingSave = async (userId: string, state: TimerState): Promise<void> => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  
  // Guardar tanto en localStorage como en Supabase
  saveTimerBackupToLocal(userId, state);
  await saveTimerStateToSupabase(userId, state);
};

// =============================================
// RECONCILIATION LOGIC
// =============================================

/**
 * Carga y reconcilia el estado del temporizador desde múltiples fuentes
 * Selecciona el estado más reciente y calcula el tiempo transcurrido
 */
export const loadAndReconcile = async (
  userId: string
): Promise<RestoredTimerInfo> => {
  console.log('🔄 [TimerPersistence] Iniciando reconciliación...');

  // Cargar de ambas fuentes
  const [supabaseData, localBackup] = await Promise.all([
    loadTimerStateFromSupabase(userId),
    Promise.resolve(loadTimerBackupFromLocal(userId)),
  ]);

  // Determinar cuál es más reciente
  let selectedState: TimerState | null = null;
  let source: 'supabase' | 'localStorage' | 'none' = 'none';
  let savedAt: number | null = null;

  if (supabaseData && localBackup) {
    const supabaseTime = new Date(supabaseData.updatedAt).getTime();
    const localTime = localBackup.savedAt;

    if (localTime > supabaseTime) {
      selectedState = localBackup.state;
      savedAt = localTime;
      source = 'localStorage';
      console.log('📱 [TimerPersistence] Usando backup local (más reciente)');
    } else {
      selectedState = supabaseData.state;
      savedAt = supabaseTime;
      source = 'supabase';
      console.log('☁️ [TimerPersistence] Usando estado de Supabase (más reciente)');
    }
  } else if (supabaseData) {
    selectedState = supabaseData.state;
    savedAt = new Date(supabaseData.updatedAt).getTime();
    source = 'supabase';
    console.log('☁️ [TimerPersistence] Usando estado de Supabase (único disponible)');
  } else if (localBackup) {
    selectedState = localBackup.state;
    savedAt = localBackup.savedAt;
    source = 'localStorage';
    console.log('📱 [TimerPersistence] Usando backup local (único disponible)');
  }

  // Si no hay estado guardado, retornar estado por defecto
  if (!selectedState) {
    console.log('🆕 [TimerPersistence] Sin estado guardado, usando default');
    return {
      state: getDefaultTimerState(),
      wasRunning: false,
      elapsedWhileAway: 0,
      source: 'none',
    };
  }

  // Calcular tiempo transcurrido si el temporizador estaba corriendo
  let elapsedWhileAway = 0;
  const wasRunning = selectedState.isRunning && selectedState.startTime !== null;

  if (wasRunning && selectedState.startTime) {
    // Calcular cuánto tiempo pasó desde que se guardó el estado
    elapsedWhileAway = Math.floor((Date.now() - selectedState.startTime) / 1000) - selectedState.accumulatedTime;
    if (elapsedWhileAway < 0) elapsedWhileAway = 0;
    
    console.log(`⏱️ [TimerPersistence] Temporizador estaba corriendo. Tiempo transcurrido mientras cerrado: ${elapsedWhileAway}s`);
  }

  return {
    state: selectedState,
    wasRunning,
    elapsedWhileAway,
    source,
  };
};

// =============================================
// INTERRUPTED SESSION DETECTION
// =============================================

/**
 * Detecta si hay una sesión interrumpida que debería mostrarse al usuario
 */
export const detectInterruptedSession = async (
  userId: string
): Promise<{
  hasInterruptedSession: boolean;
  state: TimerState | null;
  elapsedTotal: number;
  minutesWhileAway: number;
}> => {
  const restored = await loadAndReconcile(userId);

  if (!restored.wasRunning) {
    return {
      hasInterruptedSession: false,
      state: null,
      elapsedTotal: 0,
      minutesWhileAway: 0,
    };
  }

  // Calcular tiempo total transcurrido
  const elapsedTotal = restored.state.accumulatedTime + restored.elapsedWhileAway;
  const minutesWhileAway = Math.floor(restored.elapsedWhileAway / 60);

  return {
    hasInterruptedSession: true,
    state: restored.state,
    elapsedTotal,
    minutesWhileAway,
  };
};

// =============================================
// VISIBILITY & PAGE LIFECYCLE HANDLERS
// =============================================

/**
 * Guarda el estado cuando la página pierde visibilidad
 */
export const handleVisibilityChange = (
  userId: string | null,
  getTimerState: () => TimerState
): void => {
  if (!userId) return;
  
  if (document.visibilityState === 'hidden') {
    const state = getTimerState();
    console.log('👁️ [TimerPersistence] Página oculta, guardando estado...');
    flushPendingSave(userId, state);
  }
};

/**
 * Guarda el estado antes de que la página se descargue
 * Usa sendBeacon para mayor fiabilidad
 */
export const handleBeforeUnload = (
  userId: string | null,
  getTimerState: () => TimerState
): void => {
  if (!userId) return;
  
  const state = getTimerState();
  console.log('🚪 [TimerPersistence] Página cerrándose, guardando estado...');
  
  // Guardar en localStorage (síncrono, siempre funciona)
  saveTimerBackupToLocal(userId, state);
  
  // Intentar guardar en Supabase usando sendBeacon si está disponible
  // Nota: sendBeacon tiene limitaciones, localStorage es más confiable aquí
  if (navigator.sendBeacon && typeof BEACON_ENDPOINT !== 'undefined') {
    try {
      const payload = JSON.stringify({
        userId,
        state,
        timestamp: Date.now(),
      });
      navigator.sendBeacon(BEACON_ENDPOINT, payload);
    } catch (error) {
      console.error('Error enviando beacon:', error);
    }
  }
};

/**
 * Maneja el evento pagehide (más confiable que beforeunload en móviles)
 */
export const handlePageHide = (
  userId: string | null,
  getTimerState: () => TimerState,
  event: PageTransitionEvent
): void => {
  if (!userId) return;
  
  const state = getTimerState();
  console.log('📴 [TimerPersistence] PageHide, persisted:', event.persisted);
  
  // Siempre guardar en localStorage
  saveTimerBackupToLocal(userId, state);
  
  // Si la página no va a ser cacheada (persisted = false), intentar guardar en Supabase
  if (!event.persisted) {
    // Usar una promesa que no bloqueará el cierre
    saveTimerStateToSupabase(userId, state).catch(console.error);
  }
};

// =============================================
// TIMER PERSISTENCE SERVICE SINGLETON
// =============================================

class TimerPersistenceService {
  private userId: string | null = null;
  private getTimerStateCallback: (() => TimerState) | null = null;
  private isInitialized = false;

  /**
   * Inicializa el servicio con el usuario y el callback para obtener el estado
   */
  initialize(userId: string, getTimerState: () => TimerState): void {
    this.userId = userId;
    this.getTimerStateCallback = getTimerState;

    if (!this.isInitialized) {
      this.setupEventListeners();
      this.isInitialized = true;
    }

    console.log('✅ [TimerPersistenceService] Inicializado para usuario:', userId);
  }

  /**
   * Configura los event listeners para visibilidad y descarga
   */
  private setupEventListeners(): void {
    // Visibility change (cuando la app pasa a segundo plano)
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    // Before unload (cuando se cierra la pestaña/ventana)
    window.addEventListener('beforeunload', this.onBeforeUnload);

    // Page hide (más confiable en móviles)
    window.addEventListener('pagehide', this.onPageHide);

    // Page show (cuando se restaura desde bfcache)
    window.addEventListener('pageshow', this.onPageShow);

    console.log('🎧 [TimerPersistenceService] Event listeners configurados');
  }

  /**
   * Limpia los event listeners
   */
  destroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    window.removeEventListener('pagehide', this.onPageHide);
    window.removeEventListener('pageshow', this.onPageShow);

    this.userId = null;
    this.getTimerStateCallback = null;
    this.isInitialized = false;

    console.log('🔌 [TimerPersistenceService] Destruido');
  }

  private onVisibilityChange = (): void => {
    if (this.userId && this.getTimerStateCallback) {
      handleVisibilityChange(this.userId, this.getTimerStateCallback);
    }
  };

  private onBeforeUnload = (): void => {
    if (this.userId && this.getTimerStateCallback) {
      handleBeforeUnload(this.userId, this.getTimerStateCallback);
    }
  };

  private onPageHide = (event: PageTransitionEvent): void => {
    if (this.userId && this.getTimerStateCallback) {
      handlePageHide(this.userId, this.getTimerStateCallback, event);
    }
  };

  private onPageShow = (event: PageTransitionEvent): void => {
    if (event.persisted) {
      console.log('📲 [TimerPersistenceService] Página restaurada desde bfcache');
      // La app se restauró desde el caché, podría necesitar reconciliación
      // Esto se maneja en el componente principal
    }
  };

  /**
   * Guarda el estado del temporizador con debounce
   */
  save(state: TimerState, immediate = false): void {
    if (!this.userId) {
      console.warn('⚠️ [TimerPersistenceService] No hay usuario, no se puede guardar');
      return;
    }
    saveTimerStateDebounced(this.userId, state, immediate);
  }

  /**
   * Fuerza un guardado inmediato
   */
  async flush(state: TimerState): Promise<void> {
    if (!this.userId) return;
    await flushPendingSave(this.userId, state);
  }

  /**
   * Carga y reconcilia el estado del temporizador
   */
  async loadAndReconcile(): Promise<RestoredTimerInfo> {
    if (!this.userId) {
      return {
        state: getDefaultTimerState(),
        wasRunning: false,
        elapsedWhileAway: 0,
        source: 'none',
      };
    }
    return loadAndReconcile(this.userId);
  }

  /**
   * Detecta sesiones interrumpidas
   */
  async detectInterrupted(): Promise<ReturnType<typeof detectInterruptedSession>> {
    if (!this.userId) {
      return {
        hasInterruptedSession: false,
        state: null,
        elapsedTotal: 0,
        minutesWhileAway: 0,
      };
    }
    return detectInterruptedSession(this.userId);
  }

  /**
   * Limpia el backup local
   */
  clearLocalBackup(): void {
    clearTimerBackupFromLocal();
  }
}

// Exportar instancia singleton
export const timerPersistenceService = new TimerPersistenceService();
