import Link from "next/link";

import { PUBLIC_NAVIGATION_ITEMS } from "@/lib/navigation";

const linkClasses =
  "rounded-md text-sm opacity-75 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 dark:border-white/15">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div className="max-w-sm">
          <p className="text-base font-semibold tracking-tight">
            Portal Inmobiliario
          </p>
          <p className="mt-2 text-sm opacity-75">
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

      <div className="mx-auto w-full max-w-7xl border-t border-black/10 px-4 py-6 sm:px-6 lg:px-8 dark:border-white/15">
        <p className="text-sm opacity-60">
          © {currentYear} Portal Inmobiliario. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
