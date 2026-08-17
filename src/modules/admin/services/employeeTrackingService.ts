import { supabase } from "@/integrations/supabase/client";

export type TaskStatus = "not_started" | "in_progress" | "completed";
export type TaskType = "lead_followup" | "property_review" | "general";

export interface EmployeeRegion {
  id: string;
  employee_id: string;
  city: string;
  created_at: string;
  employee?: {
    name: string;
    email: string;
  };
}

export interface EmployeeTask {
  id: string;
  assignee_id: string;
  city: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  status: TaskStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: {
    name: string;
    email: string;
  };
}

export async function fetchEmployeeTasks(city?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("employee_tasks")
    .select(
      `
      *,
      assignee:auth_users!employee_tasks_assignee_id_fkey(name, email)
    `,
    )
    .order("created_at", { ascending: false });

  if (city) {
    query = query.eq("city", city);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as EmployeeTask[];
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const updates: Record<string, string> = { status, updated_at: new Date().toISOString() };
  if (status === "in_progress") {
    updates.started_at = new Date().toISOString();
  } else if (status === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("employee_tasks").update(updates).eq("id", taskId);
  if (error) throw error;
}

export async function assignRegion(employeeId: string, city: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("employee_regions")
    .insert([{ employee_id: employeeId, city }]);
  if (error) throw error;
}

export async function fetchEmployeeRegions() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("employee_regions")
    .select(
      `
      *,
      employee:auth_users!employee_regions_employee_id_fkey(name, email)
    `,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as EmployeeRegion[];
}
