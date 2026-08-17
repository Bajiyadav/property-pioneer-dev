-- Create enums for task tracking
CREATE TYPE public.task_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE public.task_type AS ENUM ('lead_followup', 'property_review', 'general');

-- Employee Regions mapping
CREATE TABLE public.employee_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, city)
);

-- Employee Tasks
CREATE TABLE public.employee_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    task_type public.task_type NOT NULL DEFAULT 'general',
    status public.task_status NOT NULL DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employee_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_tasks ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins have full access to employee_regions" ON public.employee_regions FOR ALL USING (public.has_role('admin'));
CREATE POLICY "Admins have full access to employee_tasks" ON public.employee_tasks FOR ALL USING (public.has_role('admin'));

-- Agents can view their own regions
CREATE POLICY "Agents can view their own regions" ON public.employee_regions FOR SELECT USING (employee_id = auth.uid());

-- Agents can view and update their assigned tasks
CREATE POLICY "Agents can view their assigned tasks" ON public.employee_tasks FOR SELECT USING (assignee_id = auth.uid());
CREATE POLICY "Agents can update their assigned tasks" ON public.employee_tasks FOR UPDATE USING (assignee_id = auth.uid());
