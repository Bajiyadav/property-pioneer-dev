-- NOTE ON THE ADMIN CHECK
--
-- These policies previously called `public.has_role('admin')`, which failed with
-- "function public.has_role(unknown) does not exist". Two separate problems:
--
--  1. Arity. The real signature is `has_role(_user_id uuid, _role app_role)`, so
--     a single-argument call matches nothing.
--
--  2. Grants — the one that would have bitten later. The bootstrap does
--     `REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon,
--     authenticated` and grants EXECUTE only to service_role. An RLS policy is
--     evaluated as the CALLING role, so even a correctly-typed call would have
--     been permission-denied for every real signed-in user. That failure would
--     not have appeared here at migration time; it would have appeared later as
--     employees mysteriously unable to read their own tasks.
--
-- `public.get_employee_role()` is the helper created by 20260817130000, already
-- applied. It is SECURITY DEFINER, keeps its default EXECUTE grant, reads only
-- the caller's own row via auth.uid(), and is semantically the right question to
-- ask about employee tables.

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
CREATE POLICY "Admins have full access to employee_regions" ON public.employee_regions FOR ALL USING (public.get_employee_role() = 'admin');
CREATE POLICY "Admins have full access to employee_tasks" ON public.employee_tasks FOR ALL USING (public.get_employee_role() = 'admin');

-- Agents can view their own regions
CREATE POLICY "Agents can view their own regions" ON public.employee_regions FOR SELECT USING (employee_id = auth.uid());

-- Agents can view and update their assigned tasks
CREATE POLICY "Agents can view their assigned tasks" ON public.employee_tasks FOR SELECT USING (assignee_id = auth.uid());
CREATE POLICY "Agents can update their assigned tasks" ON public.employee_tasks FOR UPDATE USING (assignee_id = auth.uid());
