-- =============================================
-- FocusFlow Database Schema for Supabase
-- Run this migration in your Supabase SQL Editor
-- =============================================
-- =============================================
-- 1. STUDY SESSIONS TABLE
-- =============================================
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);

CREATE INDEX idx_study_sessions_start_time ON study_sessions(start_time DESC);

-- Enable Row Level Security
ALTER TABLE
  study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own sessions
CREATE POLICY "Users can view their own sessions" ON study_sessions FOR
SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON study_sessions FOR
INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON study_sessions FOR
UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON study_sessions FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 2. OBJECTIVES TABLE
-- =============================================
CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL
);

-- Indexes
CREATE INDEX idx_objectives_user_id ON objectives(user_id);

CREATE INDEX idx_objectives_created_at ON objectives(created_at DESC);

-- Enable Row Level Security
ALTER TABLE
  objectives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own objectives" ON objectives FOR
SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own objectives" ON objectives FOR
INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own objectives" ON objectives FOR
UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own objectives" ON objectives FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 3. TIMER STATE TABLE (for recovery after 1 hour sync)
-- =============================================
CREATE TABLE timer_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE
  timer_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own timer state" ON timer_state FOR
SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timer state" ON timer_state FOR
INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timer state" ON timer_state FOR
UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timer state" ON timer_state FOR DELETE USING (auth.uid() = user_id);