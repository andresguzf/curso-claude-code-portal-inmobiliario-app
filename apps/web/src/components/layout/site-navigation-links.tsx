"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  LOGIN_NAVIGATION_ITEM,
  PUBLIC_NAVIGATION_ITEMS,
  isNavigationItemActive,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SiteNavigationLinksProps = {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
};

const baseLinkClasses =
  "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

export function SiteNavigationLinks({
  variant,
  onNavigate,
}: SiteNavigationLinksProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = variant === "mobile";

  return (
    <ul
      className={cn(
        "flex",
        isMobile ? "flex-col gap-1" : "flex-row items-center gap-1",
      )}
    >
      {PUBLIC_NAVIGATION_ITEMS.map((item) => {
        const isActive = isNavigationItemActive(
          item.href,
          pathname,
          searchParams,
        );

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                baseLinkClasses,
                isMobile && "block",
                isActive
                  ? "bg-black/5 font-semibold dark:bg-white/10"
                  : "opacity-75 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}

      <li className={cn(isMobile ? "mt-2" : "ml-2")}>
        <Link
          href={LOGIN_NAVIGATION_ITEM.href}
          onClick={onNavigate}
          className={cn(
            baseLinkClasses,
            "block bg-foreground text-center text-background hover:opacity-90",
          )}
        >
          {LOGIN_NAVIGATION_ITEM.label}
        </Link>
      </li>
    </ul>
  );
}
