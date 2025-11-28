import { StudySession, TimerState, Objective, PomodoroStats, NotificationSettings } from '../types';
import { getTechniqueConfig } from './techniqueService';

const STORAGE_KEY = 'focusflow_sessions_v1';
const TIMER_KEY = 'focusflow_timer_state_v1';
const OBJECTIVES_KEY = 'focusflow_objectives_v1';
const WEEKLY_TARGET_KEY = 'focusflow_weekly_target_v1';
const POMODORO_STATS_KEY = 'focusflow_pomodoro_stats_v1';
const CATEGORIES_KEY = 'focusflow_categories_v1';
const NOTIFICATION_SETTINGS_KEY = 'focusflow_notification_settings_v1';

export const saveSessions = (sessions: StudySession[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Error saving sessions", e);
  }
};

export const loadSessions = (): StudySession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error loading sessions", e);
    return [];
  }
};

export const saveTimerState = (state: TimerState): void => {
  try {
    localStorage.setItem(TIMER_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error saving timer state", e);
  }
};

export const loadTimerState = (): TimerState => {
  try {
    const data = localStorage.getItem(TIMER_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Migrar datos antiguos si no tienen técnica
      if (!parsed.technique) {
        parsed.technique = getTechniqueConfig('libre');
      }
      if (!parsed.pomodoroStats) {
        parsed.pomodoroStats = {
          daily: 0,
          weekly: 0,
          lastResetDate: Date.now()
        };
      }
      return parsed;
    }
    return {
      isRunning: false,
      startTime: null,
      accumulatedTime: 0,
      subject: 'General',
      notes: '',
      technique: getTechniqueConfig('libre'),
      pomodoroStats: {
        daily: 0,
        weekly: 0,
        lastResetDate: Date.now()
      }
    };
  } catch (e) {
    console.error("Error loading timer state", e);
    return {
      isRunning: false,
      startTime: null,
      accumulatedTime: 0,
      subject: 'General',
      notes: '',
      technique: getTechniqueConfig('libre'),
      pomodoroStats: {
        daily: 0,
        weekly: 0,
        lastResetDate: Date.now()
      }
    };
  }
};

export const saveObjectives = (objectives: Objective[]): void => {
  try {
    localStorage.setItem(OBJECTIVES_KEY, JSON.stringify(objectives));
  } catch (e) {
    console.error("Error saving objectives", e);
  }
};

export const loadObjectives = (): Objective[] => {
  try {
    const data = localStorage.getItem(OBJECTIVES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveWeeklyTarget = (hours: number): void => {
  try {
    localStorage.setItem(WEEKLY_TARGET_KEY, JSON.stringify(hours));
  } catch (e) {
    console.error("Error saving weekly target", e);
  }
};

export const loadWeeklyTarget = (): number => {
  try {
    const data = localStorage.getItem(WEEKLY_TARGET_KEY);
    return data ? JSON.parse(data) : 10; // Default 10 hours
  } catch (e) {
    return 10;
  }
};

// Funciones para estadísticas de pomodoros
export const savePomodoroStats = (stats: PomodoroStats): void => {
  try {
    localStorage.setItem(POMODORO_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Error saving pomodoro stats", e);
  }
};

export const loadPomodoroStats = (): PomodoroStats => {
  try {
    const data = localStorage.getItem(POMODORO_STATS_KEY);
    if (data) {
      const stats = JSON.parse(data);
      return resetCountsIfNeeded(stats);
    }
    return {
      daily: 0,
      weekly: 0,
      lastResetDate: Date.now()
    };
  } catch (e) {
    return {
      daily: 0,
      weekly: 0,
      lastResetDate: Date.now()
    };
  }
};

// Resetear contadores si cambió el día/semana
const resetCountsIfNeeded = (stats: PomodoroStats): PomodoroStats => {
  const now = new Date();
  const lastReset = new Date(stats.lastResetDate);
  
  // Verificar si cambió el día
  const isDifferentDay = 
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();
  
  // Verificar si cambió la semana (resetea los lunes)
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  const isDifferentWeek = getWeekNumber(now) !== getWeekNumber(lastReset);
  
  return {
    daily: isDifferentDay ? 0 : stats.daily,
    weekly: isDifferentWeek ? 0 : stats.weekly,
    lastResetDate: isDifferentDay || isDifferentWeek ? now.getTime() : stats.lastResetDate
  };
};

export const updatePomodoroCount = (stats: PomodoroStats): PomodoroStats => {
  return {
    ...stats,
    daily: stats.daily + 1,
    weekly: stats.weekly + 1
  };
};

export const loadCategories = (): string[] => {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading categories', e);
    return [];
  }
};

export const saveCategories = (categories: string[]): void => {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories', e);
  }
};

// Funciones para configuración de notificaciones
export const saveNotificationSettings = (settings: NotificationSettings): void => {
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving notification settings', e);
  }
};

export const loadNotificationSettings = (): NotificationSettings => {
  try {
    const data = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Valores por defecto
    return {
      enabled: false, // No habilitado por defecto hasta que el usuario lo active
      workEndEnabled: true,
      breakEndEnabled: true,
      cycleCompleteEnabled: true,
      soundEnabled: true,
      soundVolume: 0.5,
      vibrationEnabled: true,
    };
  } catch (e) {
    console.error('Error loading notification settings', e);
    return {
      enabled: false,
      workEndEnabled: true,
      breakEndEnabled: true,
      cycleCompleteEnabled: true,
      soundEnabled: true,
      soundVolume: 0.5,
      vibrationEnabled: true,
    };
  }
};