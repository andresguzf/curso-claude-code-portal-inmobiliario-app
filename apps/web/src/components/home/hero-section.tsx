import Link from "next/link";

import { PropertySearchForm } from "./property-search-form";

/** Hero de la portada (spec.md, sección 7). */
export function HeroSection() {
  return (
    <section
      aria-labelledby="titulo-hero"
      className="border-b border-black/10 dark:border-white/15"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h1
          id="titulo-hero"
          className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
        >
          Encuentra la propiedad que estabas buscando
        </h1>

        <p className="mt-4 max-w-2xl text-base opacity-75 sm:text-lg">
          Casas, departamentos, terrenos y oficinas en venta y arriendo, con
          información completa, fotografías y ubicación en el mapa.
        </p>

        <div className="mt-8 max-w-3xl">
          <PropertySearchForm />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/properties?operation=SALE"
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:border-white/20 dark:hover:bg-white/10"
          >
            Ver propiedades en venta
          </Link>
          <Link
            href="/properties?operation=RENT"
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:border-white/20 dark:hover:bg-white/10"
          >
            Ver propiedades en arriendo
          </Link>
        </div>
      </div>
    </section>
  );
}
