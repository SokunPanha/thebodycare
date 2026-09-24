import type { ReactNode } from "react";

// The page shell: 1200px cap, 16px gutters on phones, 32px from tablet up. (DESIGN.md §8)
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-(--shell) px-4 md:px-8 ${className}`}>{children}</div>
  );
}
