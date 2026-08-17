import Image from "next/image";
import Link from "next/link";

import { PropertySearchForm } from "./property-search-form";

/**
 * Hero de la portada (spec.md, sección 7).
 *
 * Fotografía de arquitectura de fondo con una capa oscura encima: el
 * degradado mantiene el contraste del texto sobre cualquier zona de la
 * imagen, y prolonga el tono del header para que ambos se lean como una
 * sola pieza.
 */

/** Fotografía de arquitectura corporativa (Unsplash, uso libre). */
const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=70";

export function HeroSection() {
  return (
    <section
      aria-labelledby="titulo-hero"
      className="relative isolate overflow-hidden bg-header text-on-dark"
    >
      {/*
        Decorativa: no aporta información que no esté en el texto, así que
        lleva `alt` vacío y no se anuncia a los lectores de pantalla.
      */}
      <Image
        src={HERO_IMAGE_URL}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />

      {/*
        Capa de contraste. Sin ella el texto claro resulta ilegible sobre las
        zonas brillantes de la fotografía.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-header/95 via-header/85 to-header/70"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <h1
          id="titulo-hero"
          className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
        >
          Encuentra la propiedad que estabas buscando
        </h1>

        <p className="mt-4 max-w-2xl text-base text-on-dark-muted sm:text-lg">
          Casas, departamentos, terrenos y oficinas en venta y arriendo, con
          información completa, fotografías y ubicación en el mapa.
        </p>

        <div className="mt-8 max-w-3xl">
          <PropertySearchForm />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/properties?operation=SALE"
            className="rounded-md border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-on-dark backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Ver propiedades en venta
          </Link>
          <Link
            href="/properties?operation=RENT"
            className="rounded-md border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-on-dark backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Ver propiedades en arriendo
          </Link>
        </div>
      </div>
    </section>
  );
}
