"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import type { PropertyImageDto } from "@portal/contracts";

import { RemoteImage } from "@/components/ui/remote-image";
import { cn } from "@/lib/utils";

/**
 * Galería de fotografías de una propiedad (spec.md, sección 12).
 *
 * Muestra una imagen grande con miniaturas debajo. Se puede navegar con los
 * botones laterales, con las miniaturas o con las flechas del teclado.
 *
 * Las imágenes llegan ya ordenadas por posición desde la API; aquí no se
 * reordenan.
 */

type PropertyGalleryProps = {
  readonly images: readonly PropertyImageDto[];
  /** Se usa para describir cada fotografía en su texto alternativo. */
  readonly propertyTitle: string;
};

export function PropertyGallery({
  images,
  propertyTitle,
}: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbnailListRef = useRef<HTMLUListElement>(null);

  /**
   * Mantiene visible la miniatura activa.
   *
   * Al navegar con las flechas o los botones laterales, la miniatura
   * correspondiente puede quedar fuera del área desplazable.
   */
  useEffect(() => {
    const activeThumbnail = thumbnailListRef.current?.children[activeIndex];

    activeThumbnail?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeIndex]);

  if (images.length === 0) {
    return (
      <div className="mt-8 flex aspect-[16/9] items-center justify-center rounded-xl border border-line bg-muted text-sm text-ink-muted">
        Esta propiedad todavía no tiene fotografías
      </div>
    );
  }

  const activeImage = images[activeIndex] ?? images[0];
  const hasSeveralImages = images.length > 1;

  function showPrevious() {
    setActiveIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  }

  function showNext() {
    setActiveIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  }

  /** Las flechas del teclado recorren la galería, como en un carrusel. */
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasSeveralImages) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  }

  return (
    <section
      aria-labelledby="titulo-galeria"
      className="mt-8"
      onKeyDown={handleKeyDown}
    >
      <h2 id="titulo-galeria" className="sr-only">
        Galería de fotografías
      </h2>

      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
        <RemoteImage
          key={activeImage?.id}
          src={activeImage?.url ?? ""}
          alt={describeImage(propertyTitle, activeIndex, images.length)}
          fill
          sizes="(min-width: 1024px) 64rem, 100vw"
          priority
          className="object-cover"
        />

        {hasSeveralImages ? (
          <>
            <GalleryArrow direction="previous" onClick={showPrevious} />
            <GalleryArrow direction="next" onClick={showNext} />

            <p className="absolute right-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white tabular-nums">
              {activeIndex + 1} / {images.length}
            </p>
          </>
        ) : null}
      </div>

      {/*
        Anuncia el cambio a quien usa lector de pantalla: el atributo `alt` de
        la imagen no se relee al reemplazarla.
      */}
      <p aria-live="polite" className="sr-only">
        {describeImage(propertyTitle, activeIndex, images.length)}
      </p>

      {hasSeveralImages ? (
        <ul
          ref={thumbnailListRef}
          className="mt-3 flex gap-3 overflow-x-auto pb-1"
        >
          {images.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver fotografía ${index + 1} de ${images.length}`}
                aria-current={index === activeIndex ? "true" : undefined}
                className={cn(
                  "relative block h-16 w-24 overflow-hidden rounded-lg border-2 transition-opacity sm:h-20 sm:w-28",
                  index === activeIndex
                    ? "border-accent"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <RemoteImage
                  src={image.url}
                  alt=""
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Texto alternativo que sitúa la fotografía dentro del conjunto. */
function describeImage(
  propertyTitle: string,
  index: number,
  total: number,
): string {
  return `Fotografía ${index + 1} de ${total} de ${propertyTitle}`;
}

function GalleryArrow({
  direction,
  onClick,
}: {
  readonly direction: "previous" | "next";
  readonly onClick: () => void;
}) {
  const isPrevious = direction === "previous";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrevious ? "Fotografía anterior" : "Fotografía siguiente"}
      className={cn(
        "absolute top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75",
        isPrevious ? "left-3" : "right-3",
      )}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d={isPrevious ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}
