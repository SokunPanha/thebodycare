import Form from "next/form";

import { SearchIcon } from "./icons";

/**
 * A plain GET form to /search — works before (and without) JavaScript. next/form upgrades it to a
 * client-side navigation when JS is available.
 */
export function SearchForm({
  defaultValue = "",
  size = "md",
  autoFocus = false,
}: {
  defaultValue?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
}) {
  const large = size === "lg";
  return (
    <Form action="/search" role="search" className="relative w-full">
      <label htmlFor={`search-${size}`} className="sr-only">
        Search articles
      </label>
      <SearchIcon
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-subtle ${large ? "left-5 size-5" : "left-3 size-4"}`}
      />
      <input
        id={`search-${size}`}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={large ? "Search symptoms and topics" : "Search"}
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={200}
        className={`w-full rounded-full border border-line bg-surface text-ink shadow-sm placeholder:text-ink-subtle hover:border-line-strong focus:border-primary ${
          large ? "py-4 pr-6 pl-13 text-lg shadow-md" : "py-2 pr-4 pl-9 text-sm"
        }`}
      />
    </Form>
  );
}
