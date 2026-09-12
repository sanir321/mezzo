// Minimal structural types for Cloudflare D1 bindings.
// These are scoped (not global) so they don't clash with the DOM lib.

interface D1Response {
  success: boolean;
  meta: Record<string, unknown> & { changes?: number; duration?: number };
}

interface D1Result<T = unknown> extends D1Response {
  results: T[];
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  first<T = unknown>(): Promise<T | null>;
  run<_T = unknown>(): Promise<D1Response>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[][]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Response>;
}
