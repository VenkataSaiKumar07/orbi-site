"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  maxHeight: number;
  fade: string; // background colour the fade blends into
};

export default function Collapsible({ children, maxHeight, fade }: Props) {
  const inner = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => setNatural(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const collapsible = natural > maxHeight + 48;
  const clipped = collapsible && !open;

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={clipped ? { maxHeight } : undefined}
      >
        <div ref={inner}>{children}</div>
        {clipped && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
            style={{ background: `linear-gradient(to bottom, transparent, ${fade})` }}
          />
        )}
      </div>
      {collapsible && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-2 rounded text-sm font-medium text-[#7A5678] hover:text-[#5f4260] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F0E7EF]"
        >
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
