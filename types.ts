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

export type ViewState = 'timer' | 'dashboard' | 'history';

export interface AIInsight {
  text: string;
  isLoading: boolean;
  error?: string;
}

// Tipos de técnicas de estudio
export type StudyTechnique = "libre" | "pomodoro" | "52-17";

// Sonidos disponibles
export type SoundType = "start" | "pause" | "break" | "complete";

// Configuración de sonidos
export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-1
}

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