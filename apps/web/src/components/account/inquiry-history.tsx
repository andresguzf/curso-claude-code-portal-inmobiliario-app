import Link from "next/link";

import type { UserInquiryPageDto } from "@portal/contracts";

import { RemoteImage } from "@/components/ui/remote-image";
import { HideInquiryButton } from "@/components/account/hide-inquiry-button";
import { Pagination } from "@/components/ui/pagination";
import { SearchForm } from "@/components/ui/search-form";

/**
 * Historial de solicitudes propias (spec.md, sección 17).
 *
 * Se muestran como registros y no como fichas de propiedad: quien vuelve aquí
 * busca qué preguntó y cuándo, y una cuadrícula de tarjetas oculta justo eso.
 *
 * La búsqueda y la página viven en la URL, como en el catálogo: así el botón
 * de atrás del navegador hace lo que se espera.
 */
export function InquiryHistory({
  page,
  search,
}: {
  readonly page: UserInquiryPageDto;
  readonly search: string;
}) {
  const lastPage = Math.max(1, Math.ceil(page.total / page.pageSize));

  return (
    <section aria-labelledby="propiedades-consultadas">
      <h2
        id="propiedades-consultadas"
        className="text-xl font-semibold tracking-tight"
      >
        Mis consultas
      </h2>

      <SearchForm
        basePath="/account"
        hash="#propiedades-consultadas"
        search={search}
        label="Buscar en mis consultas"
        placeholder="Título de la propiedad o texto del mensaje…"
        className="mt-4"
      />

      {page.data.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
          {search
            ? `Ninguna de tus consultas coincide con «${search}».`
            : "Aquí aparecerán las propiedades por las que has escrito. Todavía no has enviado ninguna consulta."}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {page.data.map((inquiry) => (
            <li key={inquiry.id}>
              <InquiryRow inquiry={inquiry} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        basePath="/account"
        hash="#propiedades-consultadas"
        currentPage={page.page}
        lastPage={lastPage}
        preserved={new URLSearchParams(search ? { search } : undefined)}
        label="Páginas de mis consultas"
      />
    </section>
  );
}

function InquiryRow({
  inquiry,
}: {
  readonly inquiry: UserInquiryPageDto["data"][number];
}) {
  return (
    <article className="relative flex gap-4 rounded-xl border border-line bg-card p-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24">
        {inquiry.property.imageUrl ? (
          <RemoteImage
            src={inquiry.property.imageUrl}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-base font-semibold text-ink">
          {/* El enlace cubre el registro salvo donde hay otro control. */}
          <Link
            href={`/properties/${inquiry.property.id}`}
            className="rounded-sm after:absolute after:inset-0"
          >
            {inquiry.property.title}
          </Link>
        </h3>

        <p className="text-sm break-words text-ink-muted">{inquiry.message}</p>

        <p className="mt-1 text-xs text-ink-muted">
          <time dateTime={inquiry.createdAt}>
            {formatInquiryDate(inquiry.createdAt)}
          </time>
        </p>
      </div>

      <HideInquiryButton
        inquiryId={inquiry.id}
        propertyTitle={inquiry.property.title}
      />
    </article>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatInquiryDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(isoDate));
}
