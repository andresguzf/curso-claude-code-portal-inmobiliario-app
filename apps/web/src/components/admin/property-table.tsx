import Link from "next/link";
import type { ReactNode } from "react";

import type { AdminPropertyDto } from "@portal/contracts";

import { DeletePropertyButton } from "@/components/admin/delete-property-button";
import {
  formatOperationType,
  formatPropertyPrice,
  formatPropertyType,
  formatShortLocation,
} from "@/lib/format";

/**
 * Listado de propiedades del panel (spec.md, sección 19).
 *
 * Es una tabla de verdad y no una cuadrícula de tarjetas: aquí se compara
 * entre filas —qué está publicado, qué precio tiene cada una— y para eso
 * sirven las columnas.
 *
 * A poca anchura la tabla se desplaza dentro de su propio contenedor. La
 * página nunca se desplaza en horizontal.
 */
export function PropertyTable({
  properties,
}: {
  readonly properties: readonly AdminPropertyDto[];
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-card">
      <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
        <thead className="border-b border-line text-xs tracking-wide text-ink-muted uppercase">
          <tr>
            <HeaderCell>Propiedad</HeaderCell>
            <HeaderCell>Operación</HeaderCell>
            <HeaderCell>Precio</HeaderCell>
            <HeaderCell>Estado</HeaderCell>
            <HeaderCell>
              <span className="sr-only">Acciones</span>
            </HeaderCell>
          </tr>
        </thead>

        <tbody>
          {properties.map((property) => (
            <tr
              key={property.id}
              className="border-b border-line last:border-b-0"
            >
              <td className="max-w-80 px-4 py-3">
                <Link
                  href={`/admin/properties/${property.id}/edit`}
                  className="font-medium break-words text-ink underline-offset-4 hover:underline"
                >
                  {property.title}
                </Link>
                <p className="truncate text-xs text-ink-muted">
                  {formatShortLocation(property.commune, property.city)}
                </p>
              </td>

              <td className="px-4 py-3 text-ink-muted">
                {formatOperationType(property.operationType)}
                <p className="text-xs">
                  {formatPropertyType(property.propertyType)}
                </p>
              </td>

              {/* `tabular-nums` alinea las cifras entre filas: en una
                  columna de precios, los dígitos deben caer unos sobre
                  otros para poder compararlos de un vistazo. */}
              <td className="px-4 py-3 font-medium whitespace-nowrap text-ink tabular-nums">
                {formatPropertyPrice(
                  property.price,
                  property.currency,
                  property.operationType,
                )}
              </td>

              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <Badge isStrong={property.isPublished}>
                    {property.isPublished ? "Publicada" : "Borrador"}
                  </Badge>
                  {property.isFeatured ? (
                    <Badge isStrong>Destacada</Badge>
                  ) : null}
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Link
                    href={`/admin/properties/${property.id}/edit`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium text-ink transition-colors hover:bg-muted"
                  >
                    {/* El nombre accesible repite el verbo y añade de qué
                        propiedad se trata: en una tabla, diez botones
                        llamados «Editar» no distinguen nada. */}
                    <span aria-hidden="true">Editar</span>
                    <span className="sr-only">
                      Editar la propiedad {property.title}
                    </span>
                  </Link>

                  <DeletePropertyButton
                    propertyId={property.id}
                    propertyTitle={property.title}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeaderCell({ children }: { readonly children: ReactNode }) {
  return (
    <th scope="col" className="px-4 py-3 font-medium">
      {children}
    </th>
  );
}

/**
 * Distintivo de estado.
 *
 * El texto no depende solo del color: «Borrador» y «Publicada» se leen, así
 * que quien no distinga los tonos entiende igual la diferencia.
 *
 * El texto es `ink` en ambos casos, no el acento: sobre `accent-soft` el
 * acento apenas se despega del fondo en tema oscuro, donde ambos son
 * terracotas próximos.
 */
function Badge({
  isStrong,
  children,
}: {
  readonly isStrong: boolean;
  readonly children: ReactNode;
}) {
  return (
    <span
      className={
        isStrong
          ? "inline-flex rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-ink"
          : "inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-ink-muted"
      }
    >
      {children}
    </span>
  );
}
