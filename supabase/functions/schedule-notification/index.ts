// Supabase Edge Function: Schedule Push Notification
// Called by the client when a timer starts to schedule a notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScheduleRequest {
  type: "work_complete" | "break_complete" | "cycle_complete" | "timer_reminder";
  title: string;
  body: string;
  scheduledFor: number; // Unix timestamp in milliseconds
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: ScheduleRequest = await req.json();
    
    // Validate request
    if (!body.type || !body.title || !body.body || !body.scheduledFor) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the scheduled time is in the future
    if (body.scheduledFor <= Date.now()) {
      return new Response(
        JSON.stringify({ error: "Scheduled time must be in the future" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cancel any existing pending notifications for this user
    await supabase.rpc("cancel_pending_notifications", { p_user_id: user.id });

    // Schedule new notification
    const { data, error } = await supabase
      .from("scheduled_notifications")
      .insert({
        user_id: user.id,
        type: body.type,
        title: body.title,
        body: body.body,
        scheduled_for: body.scheduledFor,
      })
      .select()
      .single();

    if (error) {
      console.error("Error scheduling notification:", error);
      return new Response(
        JSON.stringify({ error: "Failed to schedule notification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Notification scheduled",
        id: data.id,
        scheduledFor: body.scheduledFor,
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
