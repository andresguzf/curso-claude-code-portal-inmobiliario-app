"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { SiteLogo } from "./site-logo";
import { SiteNavigationLinks } from "./site-navigation-links";

const MOBILE_MENU_ID = "menu-navegacion-movil";

/** A partir de este desplazamiento el header se vuelve semitransparente. */
const SCROLL_THRESHOLD = 8;

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  /**
   * Sincroniza con el desplazamiento de la ventana, que es un sistema externo
   * al componente. Al llegar arriba el header vuelve a ser opaco: sobre el
   * hero a pantalla completa un header translúcido pierde contraste.
   */
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function toggleMobileMenu() {
    setIsMobileMenuOpen((isOpen) => !isOpen);
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 text-on-dark transition-colors duration-200",
        // Con el menú móvil abierto se mantiene opaco: el panel desplegado
        // sobre contenido translúcido resulta ilegible.
        isScrolled && !isMobileMenuOpen
          ? "bg-header/85 shadow-lg backdrop-blur-md"
          : "bg-header",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-2.5 rounded-md text-base font-semibold tracking-tight sm:text-lg"
        >
          <SiteLogo />
          {/* El nombre de marca no debe traducirse automáticamente. */}
          <span translate="no">Portal Inmobiliario</span>
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
          className="rounded-md p-2 transition-colors hover:bg-header-hover md:hidden"
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
          className="border-t border-line-on-dark px-4 py-3 sm:px-6 md:hidden"
        >
          <Suspense fallback={null}>
            <SiteNavigationLinks
              variant="mobile"
              onNavigate={closeMobileMenu}
            />
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
