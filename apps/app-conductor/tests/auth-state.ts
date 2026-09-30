type SessionLike = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
};

export type PlaywrightStorageState = {
  cookies?: Array<{ name?: string; value?: string }>;
  origins?: Array<{ localStorage?: Array<{ name?: string; value?: string }> }>;
};

function parseSession(value: string | undefined): SessionLike | null {
  if (!value) return null;

  try {
    let serialized = decodeURIComponent(value);
    if (serialized.startsWith("base64-")) {
      serialized = Buffer.from(serialized.slice("base64-".length), "base64url").toString("utf8");
    }
    return JSON.parse(serialized) as SessionLike;
  } catch {
    return null;
  }
}

function isUsableSession(session: SessionLike | null) {
  return Boolean(
    session?.access_token &&
    session.refresh_token &&
    (!session.expires_at || session.expires_at > Math.floor(Date.now() / 1000)),
  );
}

/** Detecta storageState tanto del cliente legacy (localStorage) como de @supabase/ssr (cookies). */
export function tieneSesionSupabase(state: PlaywrightStorageState) {
  const cookieGroups = new Map<string, { whole?: string; chunks: Map<number, string> }>();

  for (const cookie of state.cookies ?? []) {
    const match = cookie.name?.match(/^(sb-.+-auth-token)(?:\.(\d+))?$/);
    if (!match || !cookie.value) continue;

    const [, baseName, chunkIndex] = match;
    const group = cookieGroups.get(baseName) ?? { chunks: new Map<number, string>() };
    if (chunkIndex === undefined) group.whole = cookie.value;
    else group.chunks.set(Number(chunkIndex), cookie.value);
    cookieGroups.set(baseName, group);
  }

  for (const { whole, chunks } of cookieGroups.values()) {
    const value = whole ?? [...chunks.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, chunk]) => chunk)
      .join("");
    if (isUsableSession(parseSession(value))) return true;
  }

  return (state.origins ?? []).some((origin) =>
    (origin.localStorage ?? []).some((entry) => {
      if (entry.name !== "supabase.auth.token" && !entry.name?.endsWith("-auth-token")) return false;
      return isUsableSession(parseSession(entry.value));
    }),
  );
}
