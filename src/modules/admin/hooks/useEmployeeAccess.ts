import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkEmployeeAccess } from "@/modules/admin/services/adminFunctions";

export interface EmployeeAccessValue {
  role: string;
  regions: string[];
}

export const EMPLOYEE_ACCESS_QUERY_KEY = ["admin", "employee-access"] as const;

/**
 * The caller's employee role and regional scope.
 *
 * Shares one React Query cache entry with the admin route's gate, so child
 * pages reuse the answer instead of re-fetching it. This replaced reading
 * `access` off route context: that context came from a `beforeLoad` which
 * cannot run during SSR — the bearer token is attached by a client middleware —
 * so it threw "no authorization header" and 500'd the whole portal.
 *
 * Returns `null` while loading or when the caller is not an employee. The gate
 * in the parent route already blocks non-employees, and every server function
 * re-checks server-side, so this drives rendering only.
 */
export function useEmployeeAccess(): EmployeeAccessValue | null {
  const check = useServerFn(checkEmployeeAccess);
  const { data } = useQuery({
    queryKey: EMPLOYEE_ACCESS_QUERY_KEY,
    queryFn: () => check({}),
    retry: false,
  });
  return (data?.access as EmployeeAccessValue | undefined) ?? null;
}
