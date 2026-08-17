import { useQuery } from "@tanstack/react-query";
import { fetchEmployeeTasks, type EmployeeTask } from "../services/employeeTrackingService";

export function EmployeeActivityBoard() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["employee_tasks"],
    queryFn: () => fetchEmployeeTasks(),
  });

  if (isLoading)
    return (
      <div className="p-4 text-sm text-slate-500 animate-pulse">Loading employee activity...</div>
    );
  if (!tasks?.length)
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        No employee tasks found. Create tasks to track employee activity across regions.
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Regional Employee Activity</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track what employees work, how it is going, and how they complete tasks across regions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Column title="Not Started" status="not_started" tasks={tasks} />
        <Column title="In Progress" status="in_progress" tasks={tasks} />
        <Column title="Completed" status="completed" tasks={tasks} />
      </div>
    </div>
  );
}

function Column({
  title,
  status,
  tasks,
}: {
  title: string;
  status: string;
  tasks: EmployeeTask[];
}) {
  const columnTasks = tasks.filter((t) => t.status === status);

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col max-h-[600px]">
      <div className="flex items-center justify-between mb-4 flex-none">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className="text-xs font-medium bg-white px-2 py-1 rounded-full border border-slate-200 text-slate-600">
          {columnTasks.length}
        </span>
      </div>
      <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        {columnTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white p-3.5 rounded-lg shadow-sm border border-slate-200 text-sm hover:border-blue-300 hover:shadow-md transition-all group cursor-default"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-slate-900">{task.title}</div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {task.task_type.replace("_", " ")}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-slate-600 mt-2 line-clamp-2">{task.description}</p>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Assignee</span>
                <span className="text-slate-700 font-medium">
                  {task.assignee?.name || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Region</span>
                <span className="text-slate-700 font-medium">{task.city}</span>
              </div>
            </div>

            <div className="mt-3 bg-slate-50 rounded px-2 py-1.5 space-y-1">
              {task.started_at && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Started</span>
                  <span className="text-blue-600 font-medium">
                    {new Date(task.started_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {task.completed_at && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Completed</span>
                  <span className="text-emerald-600 font-medium">
                    {new Date(task.completed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {!task.started_at && !task.completed_at && (
                <div className="text-xs text-slate-400 italic text-center py-0.5">
                  Awaiting start
                </div>
              )}
            </div>
          </div>
        ))}

        {columnTasks.length === 0 && (
          <div className="text-sm text-slate-400 italic text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
            No tasks in this column
          </div>
        )}
      </div>
    </div>
  );
}
