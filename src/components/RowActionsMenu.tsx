"use client";

import { useEffect, useState, type ReactNode } from "react";

export type RowAction = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
};

/**
 * Kebab (⋮) trigger that opens a dropdown of row actions.
 * Self-contained: manages its own open state, closes on outside
 * click / scroll / resize, and uses fixed positioning so it is never
 * clipped by a parent's `overflow-hidden` (e.g. a rounded table frame).
 */
export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        aria-label="إجراءات"
        onClick={(e) => {
          e.stopPropagation();
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ top: r.bottom + 4, left: r.left });
          setOpen((p) => !p);
        }}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
      >
        <KebabIcon />
      </button>
      {open && (
        <div
          style={{ top: pos.top, left: pos.left }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-white py-1 text-sm shadow-lg"
        >
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false);
                a.onClick();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 ${
                a.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export function KebabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}
