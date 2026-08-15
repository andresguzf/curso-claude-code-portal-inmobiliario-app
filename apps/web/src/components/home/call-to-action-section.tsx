import Link from "next/link";

/** Llamadas a la acción de la portada (spec.md, sección 7). */
export function CallToActionSection() {
  return (
    <section aria-labelledby="titulo-cta">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-black/10 px-6 py-10 text-center sm:px-12 dark:border-white/15">
          <h2
            id="titulo-cta"
            className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          >
            Guarda tus propiedades favoritas
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-base opacity-75">
            Crea una cuenta para guardar las propiedades que te interesan y
            revisar el historial de tus consultas cuando quieras.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              Crear cuenta
            </Link>
            <Link
              href="/properties"
              className="rounded-md border border-black/15 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:border-white/20 dark:hover:bg-white/10"
            >
              Explorar el catálogo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
