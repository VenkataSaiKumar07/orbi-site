"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Conversation } from "@/lib/extract/claude";
import { loadConversation } from "@/lib/conversation-store";
import Markdown, { READING_FONT } from "@/components/Markdown";
import Collapsible from "@/components/Collapsible";

const SOURCE_NAME: Record<string, string> = { claude: "Claude", chatgpt: "ChatGPT" };

export default function ViewPage() {
  const [state, setState] = useState<"loading" | "empty" | Conversation>("loading");

  useEffect(() => {
    const c = loadConversation();
    setState(c ?? "empty");
    if (c) document.title = `${c.title} - Orbi`;
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFCFA] text-[#1A1A18] antialiased">
      <header className="sticky top-0 z-10 border-b border-[#EAE8E3] bg-[#FCFCFA]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[44rem] items-center justify-between px-5">
          <Link href="/" className="text-lg font-medium tracking-tight">
            Orbi
          </Link>
          <Link
            href="/"
            className="rounded text-sm text-[#7A5678] hover:text-[#5f4260] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F0E7EF]"
          >
            New conversation
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[44rem] px-5 pb-32 pt-10">
        {state === "loading" && <div className="h-40" aria-hidden />}

        {state === "empty" && (
          <div className="py-24 text-center">
            <h1 className="text-2xl font-medium tracking-tight">Nothing to show yet</h1>
            <p className="mt-2 text-[#8B8880]">Paste a share link on the start page to see it here.</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-[#7A5678] px-5 py-3 text-base font-medium text-white hover:bg-[#6a4868] focus:outline-none focus:ring-4 focus:ring-[#F0E7EF]"
            >
              Go to start
            </Link>
          </div>
        )}

        {typeof state === "object" && (
          <>
            <div className="mb-12">
              <h1 className="text-[1.75rem] font-medium leading-tight tracking-tight">{state.title}</h1>
              <p className="mt-2 text-sm text-[#8B8880]">
                {state.turns.length} messages from {SOURCE_NAME[state.source] ?? "the original chat"}.
                Text only. Images and files from the original aren&apos;t shown.
              </p>
            </div>

            <div className="space-y-9">
              {state.turns.map((t) =>
                t.role === "user" ? (
                  <section
                    key={t.index}
                    id={`turn-${t.index}`}
                    aria-label="You"
                    className="flex scroll-mt-20 justify-end"
                  >
                    <div className="min-w-0 max-w-[88%] rounded-[1.1rem] bg-[#F3F1EC] px-4 py-3 text-[15px] leading-relaxed">
                      <Collapsible maxHeight={208} fade="#F3F1EC">
                        <div className="whitespace-pre-wrap break-words">{t.text}</div>
                      </Collapsible>
                    </div>
                  </section>
                ) : (
                  <section
                    key={t.index}
                    id={`turn-${t.index}`}
                    aria-label={SOURCE_NAME[state.source] ?? "Assistant"}
                    className={`scroll-mt-20 break-words text-[17px] leading-[1.75] ${READING_FONT}`}
                  >
                    <Collapsible maxHeight={720} fade="#FCFCFA">
                      <Markdown>{t.text}</Markdown>
                    </Collapsible>
                  </section>
                ),
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
