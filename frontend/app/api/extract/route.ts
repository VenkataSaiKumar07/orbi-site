import { ExtractError, fetchClaudeConversation } from "@/lib/extract/claude";

const STATUS = {
  invalid_url: 400,
  not_found: 404,
  blocked: 502,
  bad_format: 502,
  network: 502,
} as const;

function fail(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return fail("invalid_url", 'Send JSON like {"url": "https://claude.ai/share/..."}.', 400);
  }
  if (typeof url !== "string" || url.length > 500) {
    return fail("invalid_url", "A link is required.", 400);
  }

  if (/^https?:\/\/(chatgpt\.com|chat\.openai\.com)\//i.test(url.trim())) {
    return fail("unsupported", "ChatGPT links are not supported yet.", 501);
  }

  try {
    const conversation = await fetchClaudeConversation(url);
    return Response.json(conversation);
  } catch (e) {
    if (e instanceof ExtractError) return fail(e.code, e.message, STATUS[e.code]);
    return fail("network", "Something went wrong.", 500);
  }
}
