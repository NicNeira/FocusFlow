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