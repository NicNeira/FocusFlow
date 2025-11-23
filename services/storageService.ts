import { StudySession, TimerState, Objective } from '../types';

const STORAGE_KEY = 'focusflow_sessions_v1';
const TIMER_KEY = 'focusflow_timer_state_v1';
const OBJECTIVES_KEY = 'focusflow_objectives_v1';
const WEEKLY_TARGET_KEY = 'focusflow_weekly_target_v1';

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
    return data ? JSON.parse(data) : {
      isRunning: false,
      startTime: null,
      accumulatedTime: 0,
      subject: 'General',
      notes: ''
    };
  } catch (e) {
    console.error("Error loading timer state", e);
    return {
      isRunning: false,
      startTime: null,
      accumulatedTime: 0,
      subject: 'General',
      notes: ''
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