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
  "rounded-md px-3 py-2 text-sm font-medium transition-colors";

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
                  ? "bg-header-hover font-semibold text-on-dark"
                  : "text-on-dark-muted hover:bg-header-hover hover:text-on-dark",
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
            "block bg-accent text-center text-white hover:bg-accent-strong",
          )}
        >
          {LOGIN_NAVIGATION_ITEM.label}
        </Link>
      </li>
    </ul>
  );
}
