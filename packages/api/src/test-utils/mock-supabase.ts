import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";

export interface MockSupabaseOptions {
  user?: { id: string; email?: string } | null;
  authError?: Error | null;
  tableData?: Record<string, unknown[] | unknown>;
  tableErrors?: Record<string, Error | null>;
  rpcData?: Record<string, unknown>;
  rpcErrors?: Record<string, Error | null>;
}

export function createMockSupabaseClient(options: MockSupabaseOptions = {}): SupabaseClient<Database> {
  const tableData = options.tableData ?? {};
  const tableErrors = options.tableErrors ?? {};
  const rpcData = options.rpcData ?? {};
  const rpcErrors = options.rpcErrors ?? {};

  const createQueryBuilder = (tableName: string) => {
    let currentData = tableData[tableName] ?? [];
    const currentError = tableErrors[tableName] ?? null;

    const builder: Record<string, any> = {
      select: vi.fn().mockImplementation(() => builder),
      insert: vi.fn().mockImplementation(() => builder),
      update: vi.fn().mockImplementation(() => builder),
      delete: vi.fn().mockImplementation(() => builder),
      eq: vi.fn().mockImplementation(() => builder),
      neq: vi.fn().mockImplementation(() => builder),
      in: vi.fn().mockImplementation(() => builder),
      not: vi.fn().mockImplementation(() => builder),
      is: vi.fn().mockImplementation(() => builder),
      or: vi.fn().mockImplementation(() => builder),
      order: vi.fn().mockImplementation(() => builder),
      range: vi.fn().mockImplementation((desde: number, hasta: number) => {
        if (Array.isArray(currentData)) {
          currentData = currentData.slice(desde, hasta + 1);
        }
        return builder;
      }),
      limit: vi.fn().mockImplementation((count: number) => {
        if (Array.isArray(currentData)) {
          currentData = currentData.slice(0, count);
        }
        return builder;
      }),
      single: vi.fn().mockImplementation(() => {
        const item = Array.isArray(currentData) ? currentData[0] ?? null : currentData;
        return Promise.resolve({ data: item, error: currentError });
      }),
      maybeSingle: vi.fn().mockImplementation(() => {
        const item = Array.isArray(currentData) ? currentData[0] ?? null : currentData;
        return Promise.resolve({ data: item, error: currentError });
      }),
      then: (resolve: (value: any) => void) => {
        resolve({ data: currentData, error: currentError });
      }
    };
    return builder;
  };

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user !== undefined ? options.user : { id: "mock-user-uuid" } },
        error: options.authError ?? null
      })
    },
    from: vi.fn().mockImplementation((tableName: string) => createQueryBuilder(tableName)),
    rpc: vi.fn().mockImplementation((fnName: string) => {
      const data = rpcData[fnName] !== undefined ? rpcData[fnName] : null;
      const error = rpcErrors[fnName] ?? null;
      return Promise.resolve({ data, error });
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "mock-path" }, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://mock.storage/signed" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://mock.storage/public" } }),
        remove: vi.fn().mockResolvedValue({ data: [], error: null })
      })
    }
  } as unknown as SupabaseClient<Database>;

  return client;
}
