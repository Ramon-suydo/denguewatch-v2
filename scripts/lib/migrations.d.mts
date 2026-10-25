export function applyPendingMigrations(db: { query: (sql: string, params?: unknown[]) => Promise<unknown> }): Promise<void>;
