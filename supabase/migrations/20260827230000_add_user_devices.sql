-- Create user_devices table to store FCM tokens
CREATE TABLE public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    device_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, device_token)
);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS handle_user_devices_updated_at ON public.user_devices;
CREATE TRIGGER handle_user_devices_updated_at BEFORE UPDATE ON public.user_devices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own devices"
    ON public.user_devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
    ON public.user_devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
    ON public.user_devices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
    ON public.user_devices FOR DELETE
    USING (auth.uid() = user_id);
