import { supabase } from './supabaseClient';
import { StudySession, Objective, TimerState, NotificationSettings } from '../types';
import { getTechniqueConfig } from './techniqueService';

// =============================================
// STUDY SESSIONS
// =============================================

export const getSessions = async (userId: string): Promise<StudySession[]> => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  return data.map((session) => ({
    id: session.id,
    subject: session.subject,
    startTime: session.start_time,
    endTime: session.end_time,
    durationSeconds: session.duration_seconds,
    notes: session.notes,
  }));
};

export const saveSession = async (
  userId: string,
  session: Omit<StudySession, 'id'>
): Promise<StudySession | null> => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userId,
      subject: session.subject,
      start_time: session.startTime,
      end_time: session.endTime,
      duration_seconds: session.durationSeconds,
      notes: session.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving session:', error);
    return null;
  }

  return {
    id: data.id,
    subject: data.subject,
    startTime: data.start_time,
    endTime: data.end_time,
    durationSeconds: data.duration_seconds,
    notes: data.notes,
  };
};

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Error deleting session:', error);
    return false;
  }

  return true;
};

// =============================================
// OBJECTIVES
// =============================================

export const getObjectives = async (userId: string): Promise<Objective[]> => {
  const { data, error } = await supabase
    .from('objectives')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching objectives:', error);
    return [];
  }

  return data.map((obj) => ({
    id: obj.id,
    text: obj.text,
    isCompleted: obj.is_completed,
    createdAt: obj.created_at,
  }));
};

export const saveObjective = async (
  userId: string,
  objective: Omit<Objective, 'id'>
): Promise<Objective | null> => {
  const { data, error } = await supabase
    .from('objectives')
    .insert({
      user_id: userId,
      text: objective.text,
      is_completed: objective.isCompleted,
      created_at: objective.createdAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving objective:', error);
    return null;
  }

  return {
    id: data.id,
    text: data.text,
    isCompleted: data.is_completed,
    createdAt: data.created_at,
  };
};

export const updateObjective = async (
  objectiveId: string,
  updates: Partial<Objective>
): Promise<boolean> => {
  const updateData: Record<string, unknown> = {};
  if (updates.text !== undefined) updateData.text = updates.text;
  if (updates.isCompleted !== undefined) updateData.is_completed = updates.isCompleted;

  const { error } = await supabase
    .from('objectives')
    .update(updateData)
    .eq('id', objectiveId);

  if (error) {
    console.error('Error updating objective:', error);
    return false;
  }

  return true;
};

export const deleteObjective = async (objectiveId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('objectives')
    .delete()
    .eq('id', objectiveId);

  if (error) {
    console.error('Error deleting objective:', error);
    return false;
  }

  return true;
};

// =============================================
// TIMER STATE (for 1-hour sync and recovery)
// =============================================

export const getTimerState = async (userId: string): Promise<TimerState | null> => {
  const { data, error } = await supabase
    .from('timer_state')
    .select('state')
    .eq('user_id', userId)
    .single();

  if (error) {
    // No timer state found is not an error
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching timer state:', error);
    return null;
  }

  return data.state as TimerState;
};

export const saveTimerState = async (
  userId: string,
  state: TimerState
): Promise<boolean> => {
  const { error } = await supabase
    .from('timer_state')
    .upsert({
      user_id: userId,
      state: state,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving timer state:', error);
    return false;
  }

  return true;
};

export const clearTimerState = async (userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('timer_state')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error clearing timer state:', error);
    return false;
  }

  return true;
};

// =============================================
// DEFAULT TIMER STATE
// =============================================

export const getDefaultTimerState = (): TimerState => ({
  isRunning: false,
  startTime: null,
  accumulatedTime: 0,
  subject: 'General',
  notes: '',
  technique: getTechniqueConfig('libre'),
  pomodoroStats: {
    daily: 0,
    weekly: 0,
    lastResetDate: Date.now(),
  },
});

// =============================================
// UTILITY FUNCTIONS FOR HISTORY
// =============================================

export interface MonthOption {
  month: number; // 0-11
  year: number;
  label: string;
}

export const getLast6Months = (): MonthOption[] => {
  const months: MonthOption[] = [];
  const now = new Date();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: date.getMonth(),
      year: date.getFullYear(),
      label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
    });
  }

  return months;
};

export const getSessionsByMonth = (
  sessions: StudySession[],
  month: number,
  year: number
): StudySession[] => {
  return sessions.filter((session) => {
    const date = new Date(session.endTime);
    return date.getMonth() === month && date.getFullYear() === year;
  });
};

// =============================================
// NOTIFICATION SETTINGS
// =============================================

export const getNotificationSettings = async (
  userId: string
): Promise<NotificationSettings | null> => {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('settings')
    .eq('user_id', userId)
    .single();

  if (error) {
    // No settings found is not an error
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching notification settings:', error);
    return null;
  }

  return data.settings as NotificationSettings;
};

export const saveNotificationSettings = async (
  userId: string,
  settings: NotificationSettings
): Promise<boolean> => {
  const { error } = await supabase
    .from('notification_settings')
    .upsert({
      user_id: userId,
      settings: settings,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving notification settings:', error);
    return false;
  }

  return true;
};

export const getDefaultNotificationSettings = (): NotificationSettings => ({
  enabled: true,
  workEndEnabled: true,
  breakEndEnabled: true,
  cycleCompleteEnabled: true,
  soundEnabled: true,
  soundVolume: 0.5,
  vibrationEnabled: false,
});
