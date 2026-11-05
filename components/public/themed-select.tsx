"use client";

import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string; hint?: string };

// A drop-down in the site's own style: one big tap target, then a bottom
// sheet with large rows. Works with a plain form (a hidden input carries the value).
export default function ThemedSelect({
  name,
  label,
  title,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  title: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    selectedRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] font-bold">{label}</span>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between gap-2 rounded-[12px] border-2 border-ink bg-white px-3 text-left text-[15px] font-semibold text-ink"
      >
        <span className="truncate">{current?.label}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/50" />
          <div className="relative mx-auto flex max-h-[80vh] w-full max-w-lg flex-col rounded-t-[22px] border-x-2 border-t-2 border-ink bg-white">
            <div className="flex items-center justify-between gap-3 border-b-2 border-ink px-4 py-3">
              <h2 className="text-lg font-extrabold text-ink">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink text-xl font-bold text-ink"
              >
                ×
              </button>
            </div>
            <ul className="overflow-y-auto overscroll-contain pb-6">
              {options.map((o) => {
                const selected = o.value === value;
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      ref={selected ? selectedRef : undefined}
                      aria-pressed={selected}
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className={
                        "flex min-h-14 w-full items-center justify-between gap-3 border-b border-brand-50 px-4 py-3 text-left text-base text-ink " +
                        (selected ? "bg-brand-50 font-extrabold" : "font-semibold")
                      }
                    >
                      <span>
                        {o.label}
                        {o.hint && <span className="ml-2 text-sm font-medium text-muted">{o.hint}</span>}
                      </span>
                      {selected && <span aria-hidden="true">✓</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
