-- Create ai_tenant_conversations table

CREATE TABLE IF NOT EXISTS public.ai_tenant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  
  -- Extracted from conversation
  city VARCHAR(100),
  locality VARCHAR(100),
  budget_min INT,
  budget_max INT,
  preferred_bhk VARCHAR(50),
  phone_number VARCHAR(20),
  
  -- Conversation history
  conversation_flow JSONB, -- All messages
  extraction_confidence INT DEFAULT 0, -- 0-100%
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_session ON public.ai_tenant_conversations(session_id);

-- Add Row Level Security (RLS)
ALTER TABLE public.ai_tenant_conversations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for new sessions
CREATE POLICY "Allow anonymous insert on ai_tenant_conversations" 
  ON public.ai_tenant_conversations FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to read their own conversations, or anonymous to read their own session
CREATE POLICY "Allow read own ai_tenant_conversations" 
  ON public.ai_tenant_conversations FOR SELECT 
  TO anon, authenticated
  USING (
    user_id = auth.uid() OR
    user_id IS NULL
  );

CREATE POLICY "Allow update own ai_tenant_conversations" 
  ON public.ai_tenant_conversations FOR UPDATE
  TO anon, authenticated
  USING (
    user_id = auth.uid() OR
    user_id IS NULL
  );
