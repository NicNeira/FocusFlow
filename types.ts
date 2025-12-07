export interface StudySession {
  id: string;
  subject: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  notes?: string;
}

export interface SubjectStats {
  subject: string;
  totalSeconds: number;
  sessionCount: number;
}

export type ViewState = 'timer' | 'dashboard' | 'history' | 'settings';

export interface AIInsight {
  text: string;
  isLoading: boolean;
  error?: string;
}

// Tipos de técnicas de estudio
export type StudyTechnique = "libre" | "pomodoro" | "52-17";

// Configuración de técnica
export interface TechniqueConfig {
  type: StudyTechnique;
  workDuration: number; // segundos
  breakDuration: number; // segundos
  isBreakTime: boolean;
  cyclesCompleted: number;
  currentCycle: number;
}

// Estadísticas de pomodoros
export interface PomodoroStats {
  daily: number;
  weekly: number;
  lastResetDate: number;
}

export interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  accumulatedTime: number;
  subject: string;
  notes: string;
  technique: TechniqueConfig;
  pomodoroStats: PomodoroStats;
}

export interface Objective {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: number;
}

// Configuración de notificaciones y sonido
export interface NotificationSettings {
  enabled: boolean;
  workEndEnabled: boolean;
  breakEndEnabled: boolean;
  cycleCompleteEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  vibrationEnabled: boolean;
}

// Metas semanales por categoría (categoría → horas objetivo)
export type WeeklyGoalsByCategory = Record<string, number>;

// Resumen mensual
export interface MonthlySummary {
  month: number; // 0-11
  year: number;
  totalSeconds: number;
  totalSessions: number;
  byCategory: Record<string, number>; // categoría → segundos
  daysActive: number;
}

// Paletas de colores disponibles
export type ColorPaletteId = 'violet' | 'blue' | 'emerald' | 'rose' | 'amber';

export interface ColorPalette {
  id: ColorPaletteId;
  name: string;
  colors: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

// Configuración de tema
export interface ThemeSettings {
  darkMode: boolean;
  colorPalette: ColorPaletteId;
}

// =============================================
// TIMER PERSISTENCE TYPES
// =============================================

// Estado de restauración del temporizador
export interface RestoredTimerState {
  state: TimerState;
  wasRunning: boolean;
  elapsedWhileAway: number; // segundos transcurridos mientras cerrado
  source: 'supabase' | 'localStorage' | 'none';
}

// Información de sesión interrumpida para mostrar al usuario
export interface InterruptedSessionInfo {
  hasInterruptedSession: boolean;
  elapsedTotal: number; // segundos totales
  minutesWhileAway: number; // minutos mientras cerrado
  subject: string;
  technique: StudyTechnique;
}

// Push notification subscription
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Timer notification payload para push
export interface TimerNotificationPayload {
  type: 'work_complete' | 'break_complete' | 'cycle_complete' | 'timer_reminder';
  title: string;
  body: string;
  userId: string;
  scheduledFor: number; // timestamp
}