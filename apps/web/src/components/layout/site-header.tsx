"use client";

import Link from "next/link";
import { Suspense, useState } from "react";

import { SiteNavigationLinks } from "./site-navigation-links";

const MOBILE_MENU_ID = "menu-navegacion-movil";

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function toggleMobileMenu() {
    setIsMobileMenuOpen((isOpen) => !isOpen);
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-background/95 backdrop-blur-sm dark:border-white/15">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="rounded-md text-base font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current sm:text-lg"
        >
          Portal Inmobiliario
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <Suspense fallback={null}>
            <SiteNavigationLinks variant="desktop" />
          </Suspense>
        </nav>

        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-controls={MOBILE_MENU_ID}
          className="rounded-md p-2 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current md:hidden dark:hover:bg-white/10"
        >
          <span className="sr-only">
            {isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          </span>
          <MenuIcon isOpen={isMobileMenuOpen} />
        </button>
      </div>

      {isMobileMenuOpen ? (
        <nav
          id={MOBILE_MENU_ID}
          aria-label="Principal móvil"
          className="border-t border-black/10 px-4 py-3 sm:px-6 md:hidden dark:border-white/15"
        >
          <Suspense fallback={null}>
            <SiteNavigationLinks variant="mobile" onNavigate={closeMobileMenu} />
          </Suspense>
        </nav>
      ) : null}
    </header>
  );
}

function MenuIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      className="size-6"
    >
      {isOpen ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}
