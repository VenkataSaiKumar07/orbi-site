"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveConversation } from "@/lib/conversation-store";

// Shared-conversation links we plan to support first.
const SHARE_LINK =
  /^https:\/\/(chatgpt\.com|chat\.openai\.com|claude\.ai)\/share\/[\w-]+\/?$/i;

export default function Home() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [urlMsg, setUrlMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [textMsg, setTextMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

    async function submitUrl(e: React.FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!SHARE_LINK.test(value)) {
      setUrlMsg({
        ok: false,
        text: "That doesn't look like a ChatGPT or Claude share link.",
      });
      return;
    }
    setLoading(true);
    setUrlMsg(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUrlMsg({ ok: false, text: data?.error?.message ?? "Something went wrong." });
      } else {
        if (saveConversation(data)) {
       router.push("/view");
     } else {
        setUrlMsg({
          ok: false,
          text: "Your browser blocked temporary storage, so we can't open the conversation.",
        });
      }
      }
    } catch {
      setUrlMsg({ ok: false, text: "Could not reach the server. Try again." });
    } finally {
      setLoading(false);
    }
  }

  function submitText(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 20) {
      setTextMsg({ ok: false, text: "Paste a bit more of the conversation." });
      return;
    }
    // Backend isn't connected yet.
    setTextMsg({ ok: true, text: "Got it. Processing comes next." });
  }

  const inputBase =
    "w-full rounded-lg border border-[#EAE8E3] bg-white px-4 py-3 text-base text-[#1A1A18] " +
    "placeholder:text-[#8B8880] outline-none transition " +
    "focus:border-[#A886A6] focus:ring-4 focus:ring-[#F0E7EF]";

  const button =
    "rounded-lg bg-[#7A5678] px-5 py-3 text-base font-medium text-white transition " +
    "hover:bg-[#6a4868] focus:outline-none focus:ring-4 focus:ring-[#F0E7EF]";

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#FCFCFA] px-6 py-16 sm:py-24">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-medium tracking-tight text-[#1A1A18]">Orbi</h1>
        <p className="mt-2 text-base text-[#8B8880]">
          Paste a link to a shared conversation to see it structured.
        </p>

        {/* Primary: share link */}
        <form onSubmit={submitUrl} className="mt-10">
          <label htmlFor="url" className="mb-2 block text-sm font-medium text-[#1A1A18]">
            Shared conversation link
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="url"
              type="url"
              inputMode="url"
              autoComplete="off"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlMsg(null);
              }}
              placeholder="https://chatgpt.com/share/..."
              className={inputBase}
            />
            <button type="submit" disabled={loading} className={`${button} disabled:opacity-60`}>
              {loading ? "Reading..." : "Continue"}
            </button>
          </div>
          {urlMsg && (
            <p className={`mt-2 text-sm ${urlMsg.ok ? "text-[#7A5678]" : "text-[#B3402F]"}`}>
              {urlMsg.text}
            </p>
          )}
        </form>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#EAE8E3]" />
          <span className="text-sm text-[#8B8880]">or paste the text</span>
          <div className="h-px flex-1 bg-[#EAE8E3]" />
        </div>

        {/* Backup: pasted text */}
        <form onSubmit={submitText}>
          <label htmlFor="text" className="mb-2 block text-sm font-medium text-[#1A1A18]">
            Conversation text
          </label>
          <textarea
            id="text"
            rows={8}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setTextMsg(null);
            }}
            placeholder="Paste the full conversation here..."
            className={`${inputBase} resize-y`}
          />
          <p className="mt-2 text-sm text-[#8B8880]">
            Pasted text can blur who said what. A share link keeps your messages and the
            AI&apos;s replies separate.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <button type="submit" className={button}>
              Continue
            </button>
            {textMsg && (
              <p className={`text-sm ${textMsg.ok ? "text-[#7A5678]" : "text-[#B3402F]"}`}>
                {textMsg.text}
              </p>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
