import type { PropertySummaryDto } from "@portal/contracts";

import { cn } from "@/lib/utils";

import { DEFAULT_CARD_IMAGE_SIZES, PropertyCard } from "./property-card";

/**
 * Cuadrícula responsive de propiedades (spec.md, secciones 8 y 23).
 *
 * Una columna en móvil, dos en tablet y tres en escritorio. Es una lista
 * para que las tecnologías de asistencia anuncien cuántas propiedades hay.
 *
 * Solo se ocupa de la disposición: los estados de carga, vacío y error los
 * decide quien la usa.
 */

/** Cuántas primeras tarjetas cargan su imagen con prioridad. */
const PRIORITY_CARD_COUNT = 3;

type PropertyGridProps = {
  readonly properties: readonly PropertySummaryDto[];
  /** Descriptor `sizes` de las imágenes, si se altera el número de columnas. */
  readonly imageSizes?: string;
  /** Prioriza la carga de las primeras imágenes (contenido visible al entrar). */
  readonly prioritizeFirstImages?: boolean;
  /**
   * Identificadores ya guardados, o `undefined` para no ofrecer el botón.
   *
   * Llega resuelto desde el servidor: preguntarlo desde el navegador haría
   * parpadear todas las tarjetas al cargar.
   */
  readonly favoritePropertyIds?: ReadonlySet<string> | undefined;
  readonly className?: string;
};

export function PropertyGrid({
  properties,
  imageSizes = DEFAULT_CARD_IMAGE_SIZES,
  prioritizeFirstImages = false,
  favoritePropertyIds,
  className,
}: PropertyGridProps) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {properties.map((property, index) => (
        <li key={property.id}>
          <PropertyCard
            property={property}
            imageSizes={imageSizes}
            priority={prioritizeFirstImages && index < PRIORITY_CARD_COUNT}
            isFavorite={favoritePropertyIds?.has(property.id)}
          />
        </li>
      ))}
    </ul>
  );
}
