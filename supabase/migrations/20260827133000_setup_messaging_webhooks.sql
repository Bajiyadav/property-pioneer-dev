-- Migration: Setup Messaging Webhooks
-- Enables pg_net and sets up triggers to call the automated-messaging edge function

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- We need a webhook trigger function that sends an HTTP request to our Edge Function
CREATE OR REPLACE FUNCTION public.invoke_automated_messaging()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url text := current_setting('custom.edge_function_url', true);
  edge_function_anon_key text := current_setting('custom.edge_function_anon_key', true);
  payload jsonb;
  request_id bigint;
BEGIN
  -- If we don't have the URL/Key set in the database settings, we'll try to use a local or fallback
  IF edge_function_url IS NULL OR edge_function_url = '' THEN
    edge_function_url := 'http://host.docker.internal:54321/functions/v1/automated-messaging';
  END IF;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW)
  );

  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', COALESCE('Bearer ' || edge_function_anon_key, '')
    ),
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Trigger for New User Signup (Welcome Message)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.invoke_automated_messaging();

-- 2. Trigger for Site Visitors (Security Alert)
DROP TRIGGER IF EXISTS on_site_visitor_created ON public.site_visitors;
CREATE TRIGGER on_site_visitor_created
  AFTER INSERT ON public.site_visitors
  FOR EACH ROW
  EXECUTE FUNCTION public.invoke_automated_messaging();
