import { createFileRoute } from "@tanstack/react-router";
import { getEmployeeActivity } from "@/modules/admin/services/adminFunctions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock, ShieldCheck, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  component: EmployeeActivityPage,
  loader: () => getEmployeeActivity(),
});

function EmployeeActivityPage() {
  const activities = Route.useLoaderData();

  if (!activities || activities.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">No employee activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employee Activity</h1>
        <p className="text-muted-foreground">
          Monitor tasks, moderations, and actions performed by your team.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground">Recorded in the log</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Chronological feed of employee actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((log) => {
                const isPropertyUpdate = log.event === "property_updated";
                const isAccessUpdate = log.event === "employee_access_updated";

                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={log.employee_avatar || undefined} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        {log.employee_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.employee_role || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isPropertyUpdate && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          <ShieldCheck className="mr-1 h-3 w-3" /> Property Updated
                        </Badge>
                      )}
                      {isAccessUpdate && (
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-800 hover:bg-purple-200"
                        >
                          <User className="mr-1 h-3 w-3" /> Access Updated
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {isPropertyUpdate && (
                        <span className="text-muted-foreground">
                          Target: Property{" "}
                          <span className="font-mono text-xs">
                            {log.subject_id?.split("-")[0]}...
                          </span>
                          {/* We can parse details JSON to show exactly what changed */}
                          {Object.keys(log.details || {}).map((key) => (
                            <span
                              key={key}
                              className="ml-2 inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                            >
                              {key}: {String((log.details as Record<string, unknown>)[key])}
                            </span>
                          ))}
                        </span>
                      )}
                      {isAccessUpdate && (
                        <span className="text-muted-foreground">
                          Updated permissions for{" "}
                          <span className="font-mono text-xs">
                            {log.subject_id?.split("-")[0]}...
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
