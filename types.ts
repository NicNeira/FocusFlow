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

export interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  accumulatedTime: number;
  subject: string;
  notes: string;
}

export interface Objective {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: number;
}