import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:Harika@143@db.iyttetfaavokzyexvqam.supabase.co:5432/postgres";

// Configure high-performance connection pool
// Reuses connections, prevents cold starts, auto-reconnects on drop
const globalForDb = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

export const sql =
  globalForDb.sql ??
  postgres(connectionString, {
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
  globalForDb.sql = sql;
}

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
