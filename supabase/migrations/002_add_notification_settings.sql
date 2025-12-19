-- =============================================
-- FocusFlow - Notification Settings Table Migration
-- Add notification_settings table for user preferences
-- =============================================

-- =============================================
-- NOTIFICATION SETTINGS TABLE
-- =============================================

-- Eliminar tabla si existe (para hacer la migración idempotente)
DROP TABLE IF EXISTS notification_settings CASCADE;

-- Crear tabla notification_settings
CREATE TABLE notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can view their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification settings" ON notification_settings;

-- RLS Policies: Users can only access their own notification settings
CREATE POLICY "Users can view their own notification settings" 
  ON notification_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
  ON notification_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
  ON notification_settings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings" 
  ON notification_settings FOR DELETE 
  USING (auth.uid() = user_id);
