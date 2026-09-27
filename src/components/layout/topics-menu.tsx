"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type NavCategory = { slug: string; name: string };

/**
 * "Topics ▾" — every topic in one dropdown, so the header stays one row however many topics there
 * are (eight didn't fit beside a search box even at 1440px). A disclosure button, not an ARIA
 * menu: the panel is ordinary links. Closes on Escape, an outside click, or navigating.
 */
export function TopicsMenu({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  // Open "at" a path: navigating anywhere closes it, with no effect needed.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (value: boolean) => setOpenAt(value ? pathname : null);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenAt(null);
        button.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpenAt(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const inTopic = pathname.startsWith("/category/");

  return (
    <div ref={root} className="md:relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium ${
          open || inTopic
            ? "bg-surface text-ink shadow-sm"
            : "text-ink-muted hover:bg-surface hover:text-ink"
        }`}
      >
        Topics
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="m4 6 4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-4 top-full mt-2 rounded-xl bg-surface p-3 shadow-lg md:inset-x-auto md:left-0 md:w-[34rem]"
      >
        <ul className="grid gap-1 sm:grid-cols-2">
          {categories.map((category) => {
            const href = `/category/${category.slug}` as const;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={category.slug}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-lg px-4 py-3 text-sm font-medium no-underline ${
                    active
                      ? "bg-primary-wash text-primary"
                      : "text-ink hover:bg-surface-subtle hover:text-primary"
                  }`}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 border-t border-line px-4 pt-3 text-sm">
          <Link href="/about" className="font-medium no-underline">
            About {""}
            <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
