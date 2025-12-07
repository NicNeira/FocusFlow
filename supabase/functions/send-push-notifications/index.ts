// Supabase Edge Function: Send Push Notifications
// This function is triggered by a cron job or manually to send due push notifications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Web Push library for Deno
// Note: You'll need to use a web-push compatible library or implement VAPID signing

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushSubscription {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

interface PendingNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  scheduled_for: number;
}

// VAPID keys - these should be stored in environment variables
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@focusflow.app";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const currentTime = Date.now();

    // Get pending notifications
    const { data: pendingNotifications, error: fetchError } = await supabase
      .rpc("get_pending_notifications", { p_current_time: currentTime });

    if (fetchError) {
      console.error("Error fetching pending notifications:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch notifications" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending notifications", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${pendingNotifications.length} pending notifications`);

    let sentCount = 0;
    let failedCount = 0;

    // Process each notification
    for (const notification of pendingNotifications as PendingNotification[]) {
      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh_key, auth_key")
        .eq("user_id", notification.user_id);

      if (subError || !subscriptions || subscriptions.length === 0) {
        console.log(`No subscriptions found for user ${notification.user_id}`);
        // Mark as sent anyway to prevent infinite retries
        await supabase.rpc("mark_notification_sent", { p_notification_id: notification.id });
        continue;
      }

      // Send to all user's subscriptions
      for (const sub of subscriptions as PushSubscription[]) {
        try {
          const success = await sendPushNotification(sub, {
            title: notification.title,
            body: notification.body,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/badge-72x72.png",
            tag: notification.type,
            data: {
              type: notification.type,
              url: "/",
            },
          });

          if (success) {
            sentCount++;
          } else {
            failedCount++;
            // Optionally remove invalid subscription
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
        } catch (error) {
          console.error("Error sending push:", error);
          failedCount++;
        }
      }

      // Mark notification as sent
      await supabase.rpc("mark_notification_sent", { p_notification_id: notification.id });
    }

    return new Response(
      JSON.stringify({
        message: "Notifications processed",
        sent: sentCount,
        failed: failedCount,
        total: pendingNotifications.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Send push notification using Web Push protocol
async function sendPushNotification(
  subscription: PushSubscription,
  payload: object
): Promise<boolean> {
  try {
    // Build the push message
    const pushPayload = JSON.stringify(payload);
    
    // For a full implementation, you would need to:
    // 1. Generate VAPID headers
    // 2. Encrypt the payload using the subscription keys
    // 3. Send to the push service endpoint
    
    // Simplified implementation using fetch
    // Note: This requires proper VAPID signing which is complex in Deno
    // Consider using a service like OneSignal or implementing full Web Push spec
    
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "86400", // 24 hours
        // VAPID Authorization header would go here
      },
      body: pushPayload,
    });

    if (response.status === 201 || response.status === 200) {
      console.log("Push notification sent successfully");
      return true;
    } else if (response.status === 404 || response.status === 410) {
      console.log("Subscription expired or invalid");
      return false;
    } else {
      console.error("Push failed with status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return false;
  }
}
