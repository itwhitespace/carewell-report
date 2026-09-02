-- ==============================================================================
-- System Flows Schema
-- Execute this SQL in Supabase Dashboard (SQL Editor)
-- ==============================================================================

-- 1. Table: system_flows
CREATE TABLE IF NOT EXISTS public.system_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: flow_steps
CREATE TABLE IF NOT EXISTS public.flow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.system_flows(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_system_flows_updated_at ON public.system_flows;
CREATE TRIGGER set_system_flows_updated_at
  BEFORE UPDATE ON public.system_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_flow_steps_updated_at ON public.flow_steps;
CREATE TRIGGER set_flow_steps_updated_at
  BEFORE UPDATE ON public.flow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_flow_steps_flow_id ON public.flow_steps(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_steps_order ON public.flow_steps(flow_id, step_number);

-- 5. Row Level Security (RLS) policies
ALTER TABLE public.system_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_steps ENABLE ROW LEVEL SECURITY;

-- Allow full read/write for server role and anon access
DROP POLICY IF EXISTS "Allow all access to system_flows" ON public.system_flows;
CREATE POLICY "Allow all access to system_flows" ON public.system_flows FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to flow_steps" ON public.flow_steps;
CREATE POLICY "Allow all access to flow_steps" ON public.flow_steps FOR ALL USING (true) WITH CHECK (true);
