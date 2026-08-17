import Link from "next/link";

import { PUBLIC_NAVIGATION_ITEMS } from "@/lib/navigation";

import { SiteLogo } from "./site-logo";

const linkClasses =
  "rounded-md text-sm text-on-dark-muted transition-colors hover:text-on-dark";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-footer text-on-dark">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div className="max-w-sm">
          <p className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
            <SiteLogo className="size-7" />
            {/* El nombre de marca no debe traducirse automáticamente. */}
            <span translate="no">Portal Inmobiliario</span>
          </p>
          <p className="mt-2 text-sm text-on-dark-muted">
            Propiedades en venta y arriendo: casas, departamentos, terrenos y
            oficinas.
          </p>
        </div>

        <nav aria-labelledby="titulo-navegacion-pie">
          <h2
            id="titulo-navegacion-pie"
            className="text-sm font-semibold tracking-tight"
          >
            Navegación
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {PUBLIC_NAVIGATION_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClasses}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-on-dark-muted">
            © {currentYear} Portal Inmobiliario. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
