import type { Conversation, Turn } from "@/lib/extract/claude";

// The extracted conversation lives only in this browser tab for now.
// Nothing is sent to a database from here.
const KEY = "orbi:conversation";

export function saveConversation(c: Conversation): boolean {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(c));
    return true;
  } catch {
    return false;
  }
}

function isTurn(t: unknown): t is Turn {
  const x = t as Partial<Turn> | null;
  return (
    !!x &&
    (x.role === "user" || x.role === "assistant") &&
    typeof x.text === "string" &&
    typeof x.index === "number"
  );
}

export function loadConversation(): Conversation | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { source?: string; title?: unknown; turns?: unknown };
    if (typeof data.title !== "string" || !Array.isArray(data.turns)) return null;
    const turns = data.turns.filter(isTurn);
    if (turns.length === 0) return null;
    return { source: data.source as Conversation["source"], title: data.title, turns };
  } catch {
    return null;
  }
}
