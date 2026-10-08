// Extractor for Claude share links (claude.ai/share/<id>).
//
// parseClaudeSnapshot() is pure: it turns Claude's snapshot JSON into clean turns
// and is safe to keep long term (it also works on JSON from any other source).
//
// fetchClaudeConversation() is the fragile part. See the PROTOTYPE note below.
export type Turn = {
  index: number;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

export type Conversation = {
  source: "claude";
  title: string;
  turns: Turn[];
};

export type ExtractErrorCode =
  | "invalid_url"
  | "not_found"
  | "blocked"
  | "bad_format"
  | "network";

export class ExtractError extends Error {
  code: ExtractErrorCode;
  constructor(code: ExtractErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

// Only ever returns the share id. We build the request URL ourselves, so the
// user-supplied URL is never fetched directly.
export function parseClaudeShareUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new ExtractError("invalid_url", "That is not a valid link.");
  }
  const match = /^\/share\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i.exec(
    url.pathname,
  );
  if (url.protocol !== "https:" || url.hostname !== "claude.ai" || !match) {
    throw new ExtractError("invalid_url", "That is not a Claude share link.");
  }
  return match[1].toLowerCase();
}

type Block = { type?: string; text?: string };
type RawMessage = {
  sender?: string;
  index?: number;
  created_at?: string;
  content?: Block[];
};

export function parseClaudeSnapshot(json: unknown): Conversation {
  const data = json as { snapshot_name?: unknown; chat_messages?: unknown } | null;
  if (!data || !Array.isArray(data.chat_messages)) {
    throw new ExtractError("bad_format", "Unexpected response format from Claude.");
  }

  const turns: Turn[] = [];
  for (const raw of data.chat_messages as RawMessage[]) {
    const role =
      raw.sender === "human" ? "user" : raw.sender === "assistant" ? "assistant" : null;
    if (!role || !Array.isArray(raw.content)) continue;

    // The message-level `text` field is empty; the real text lives in content
    // blocks. Tool calls and tool results (e.g. web search) are skipped.
    const text = raw.content
      .filter((b) => b?.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("\n\n")
      .trim();
    if (!text) continue;

    turns.push({
      index: typeof raw.index === "number" ? raw.index : turns.length,
      role,
      text,
      createdAt: raw.created_at ?? "",
    });
  }

  if (turns.length === 0) {
    throw new ExtractError("bad_format", "No messages found in this conversation.");
  }
  turns.sort((a, b) => a.index - b.index);

  const title =
    typeof data.snapshot_name === "string" && data.snapshot_name.trim()
      ? data.snapshot_name.trim()
      : "Untitled conversation";

  // Deliberately not returned: creator name, ids, and other account metadata.
  return { source: "claude", title, turns };
}

// PROTOTYPE ONLY.
// Claude's servers answer a Cloudflare challenge (HTTP 403) to requests that
// identify as a script, and return the data only to browser-like requests.
// Presenting a browser User-Agent works today, but it works around their bot
// protection, can stop working at any time, and automated access is something
// Anthropic's consumer terms restrict. Do not build the product on this path.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

export async function fetchClaudeConversation(shareUrl: string): Promise<Conversation> {
  const id = parseClaudeShareUrl(shareUrl);
  const api = `https://claude.ai/api/chat_snapshots/${id}?rendering_mode=messages&render_all_tools=true`;

  let res: Response;
  try {
    res = await fetch(api, {
      headers: { "user-agent": BROWSER_UA, accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new ExtractError("network", "Could not reach Claude. Try again in a moment.");
  }

  if (res.status === 404) {
    throw new ExtractError("not_found", "That share link does not exist or was deleted.");
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("application/json")) {
    throw new ExtractError(
      "blocked",
      "Claude would not let us read that link. Paste the conversation text instead.",
    );
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ExtractError("bad_format", "Unexpected response format from Claude.");
  }
  return parseClaudeSnapshot(json);
}
