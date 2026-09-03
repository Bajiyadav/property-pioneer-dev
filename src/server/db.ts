import postgres from "postgres";

/**
 * The connection string is required — there is no fallback.
 *
 * A default here used to hold a live Supabase password, which meant the
 * production database credential was readable by anyone with repository access
 * and stayed in git history after the file was edited. A missing DATABASE_URL is
 * a deployment error, so it fails loudly rather than silently pointing a build
 * at whatever database the default named.
 *
 * The failure is raised on first use rather than at import, so a module that
 * merely imports `sql` — a test that stubs the database, a route that never
 * queries — is not brought down by configuration it does not need.
 */
const globalForDb = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

function createClient(): postgres.Sql {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in the deployment environment " +
        "(Vercel project settings / ECS task definition / local .env) — " +
        "database credentials are never checked into the repository.",
    );
  }

  // Configure high-performance connection pool
  // Reuses connections, prevents cold starts, auto-reconnects on drop
  const client = postgres(connectionString, {
    max: 20, // Max 20 concurrent pooled connections
    idle_timeout: 30, // Idle timeout in seconds
    connect_timeout: 10, // Fast 10s connect timeout
    prepare: true, // Cache prepared statements for sub-millisecond execution
    ssl: "require", // Cloud PostgreSQL requires SSL encryption
    transform: {
      undefined: null,
    },
    onnotice: () => {}, // Suppress notice logs in production
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.sql = client;
  }

  return client;
}

let clientInstance: postgres.Sql | null = null;

function client(): postgres.Sql {
  if (globalForDb.sql) return globalForDb.sql;
  if (!clientInstance) clientInstance = createClient();
  return clientInstance;
}

/**
 * Tagged-template SQL client. Behaves exactly like the `postgres` client; the
 * proxy exists only so the connection is opened on first use.
 */
export const sql = new Proxy(function () {} as unknown as postgres.Sql, {
  apply(_target, _thisArg, args: unknown[]) {
    return (client() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_target, prop, receiver) {
    return Reflect.get(client() as object, prop, receiver);
  },
  has(_target, prop) {
    return Reflect.has(client() as object, prop);
  },
}) as postgres.Sql;

/**
 * Execute a query with timing diagnostics
 */
export async function timedQuery<T>(
  name: string,
  queryFn: () => Promise<T>,
): Promise<{ data: T; durationMs: number }> {
  const start = performance.now();
  const data = await queryFn();
  const durationMs = Number((performance.now() - start).toFixed(2));
  return { data, durationMs };
}
