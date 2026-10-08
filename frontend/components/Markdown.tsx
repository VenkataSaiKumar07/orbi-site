"use client";

import { memo, useState, isValidElement } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "./code.css";

export const READING_FONT =
  "font-['Iowan_Old_Style','Charter','Palatino_Linotype',Georgia,serif]";

const MONO =
  "font-[family-name:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace]";

export const SANS =
  "font-[family-name:system-ui,-apple-system,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]";

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) {
    return textOf((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

function CodeBlock({ children }: { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const child = isValidElement(children)
    ? (children as React.ReactElement<{ className?: string; children?: React.ReactNode }>)
    : null;
  const className = child?.props.className ?? "";
  const lang = /language-([\w+-]+)/.exec(className)?.[1] ?? "";
  const code = textOf(child?.props.children ?? children);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code.replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-[#EAE8E3] bg-[#F7F5F0]">
      <div className={`flex items-center justify-between border-b border-[#EAE8E3] px-4 py-2 ${SANS} text-xs text-[#8B8880]`}>
        <span>{lang || "code"}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded px-1.5 py-0.5 font-medium text-[#6B6860] hover:text-[#1A1A18] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F0E7EF]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-6">
        <code className={`${className} ${MONO}`}>{child?.props.children ?? children}</code>
      </pre>
    </div>
  );
}

const components: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  code: ({ className, children }) => (
    <code
      className={`${className ?? ""} rounded bg-[#F3F1EC] px-1.5 py-0.5 ${MONO} text-[0.86em]`}
    >
      {children}
    </code>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-[#7A5678] underline decoration-[#A886A6]/50 underline-offset-2 hover:decoration-[#7A5678]"
    >
      {children}
    </a>
  ),
  img: () => <span className="text-[#8B8880]">[image omitted]</span>,
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-[#EAE8E3]">
      <table className={`${SANS} w-full border-collapse text-left text-[14px]`}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#F7F5F0]">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-[#EAE8E3] px-3 py-2 font-medium">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-t border-[#EAE8E3] px-3 py-2 align-top">{children}</td>
  ),
  h1: ({ children }) => (
    <h1 className={`${SANS} mb-3 mt-8 text-[1.4rem] font-semibold leading-snug tracking-tight`}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className={`${SANS} mb-3 mt-7 text-[1.2rem] font-semibold leading-snug tracking-tight`}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className={`${SANS} mb-2 mt-6 text-[1.05rem] font-semibold leading-snug`}>{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className={`${SANS} mb-2 mt-5 text-[0.95rem] font-semibold leading-snug`}>{children}</h4>
  ),
  p: ({ children }) => <p className="my-4">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-4 list-disc space-y-1.5 pl-6 marker:text-[#A886A6]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-1.5 pl-6 marker:text-[#A886A6]">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1 [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-5 border-l-2 border-[#A886A6] pl-4 text-[#55534D]">{children}</blockquote>
  ),
  hr: () => <hr className="my-8 border-[#EAE8E3]" />,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

function Markdown({ children }: { children: string }) {
  return (
    <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
