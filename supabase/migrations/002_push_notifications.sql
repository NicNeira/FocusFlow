-- =============================================
-- Push Notifications Schema for FocusFlow
-- Run this migration in your Supabase SQL Editor
-- =============================================
-- =============================================
-- 1. PUSH SUBSCRIPTIONS TABLE
-- Stores web push notification subscriptions for each user
-- =============================================
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique subscription per endpoint per user
  UNIQUE(user_id, endpoint)
);

-- Indexes for performance
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Enable Row Level Security
ALTER TABLE
  push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions FOR
SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions FOR
INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions FOR
UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 2. SCHEDULED NOTIFICATIONS TABLE
-- Stores scheduled push notifications (e.g., timer completion)
-- =============================================
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'work_complete',
      'break_complete',
      'cycle_complete',
      'timer_reminder'
    )
  ),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for BIGINT NOT NULL,
  -- Unix timestamp in milliseconds
  sent_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);

CREATE INDEX idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);

CREATE INDEX idx_scheduled_notifications_pending ON scheduled_notifications(scheduled_for)
WHERE
  sent_at IS NULL
  AND cancelled_at IS NULL;

-- Enable Row Level Security
ALTER TABLE
  scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scheduled notifications" ON scheduled_notifications FOR
SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled notifications" ON scheduled_notifications FOR
INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled notifications" ON scheduled_notifications FOR
UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled notifications" ON scheduled_notifications FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 3. FUNCTION TO CLEANUP OLD SUBSCRIPTIONS
-- Removes subscriptions older than 30 days (optional maintenance)
-- =============================================
CREATE
OR REPLACE FUNCTION cleanup_old_push_subscriptions() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $ $ BEGIN
DELETE FROM
  push_subscriptions
WHERE
  updated_at < NOW() - INTERVAL '30 days';

END;

$ $;

-- =============================================
-- 4. FUNCTION TO CANCEL USER'S PENDING NOTIFICATIONS
-- Called when timer is stopped/reset
-- =============================================
CREATE
OR REPLACE FUNCTION cancel_pending_notifications(p_user_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $ $ BEGIN
UPDATE
  scheduled_notifications
SET
  cancelled_at = NOW()
WHERE
  user_id = p_user_id
  AND sent_at IS NULL
  AND cancelled_at IS NULL;

END;

$ $;

-- =============================================
-- 5. FUNCTION TO GET PENDING NOTIFICATIONS TO SEND
-- Used by the Edge Function to fetch due notifications
-- =============================================
CREATE
OR REPLACE FUNCTION get_pending_notifications(p_current_time BIGINT) RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  title TEXT,
  body TEXT,
  scheduled_for BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $ $ BEGIN RETURN QUERY
SELECT
  sn.id,
  sn.user_id,
  sn.type,
  sn.title,
  sn.body,
  sn.scheduled_for
FROM
  scheduled_notifications sn
WHERE
  sn.scheduled_for <= p_current_time
  AND sn.sent_at IS NULL
  AND sn.cancelled_at IS NULL
ORDER BY
  sn.scheduled_for ASC
LIMIT
  100;

END;

$ $;

-- =============================================
-- 6. FUNCTION TO MARK NOTIFICATION AS SENT
-- =============================================
CREATE
OR REPLACE FUNCTION mark_notification_sent(p_notification_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $ $ BEGIN
UPDATE
  scheduled_notifications
SET
  sent_at = NOW()
WHERE
  id = p_notification_id;

END;

$ $;