import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { UserInquiryPageDto } from "@portal/contracts";

import { HideInquiryButton } from "@/components/account/hide-inquiry-button";
import { InquirySearch } from "@/components/account/inquiry-search";

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

      <InquirySearch search={search} className="mt-4" />

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

      <Pagination currentPage={page.page} lastPage={lastPage} search={search} />
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
          <Image
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

function Pagination({
  currentPage,
  lastPage,
  search,
}: {
  readonly currentPage: number;
  readonly lastPage: number;
  readonly search: string;
}) {
  if (lastPage <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Páginas de mis consultas"
      className="mt-6 flex items-center justify-between gap-4"
    >
      <PageLink
        page={currentPage - 1}
        search={search}
        isDisabled={currentPage <= 1}
      >
        ← Anteriores
      </PageLink>

      <p className="text-sm text-ink-muted">
        Página {currentPage} de {lastPage}
      </p>

      <PageLink
        page={currentPage + 1}
        search={search}
        isDisabled={currentPage >= lastPage}
      >
        Siguientes →
      </PageLink>
    </nav>
  );
}

/**
 * Un extremo del recorrido.
 *
 * En el límite se pinta como texto y no como enlace inerte: un enlace que no
 * lleva a ninguna parte confunde a quien navega con teclado.
 */
function PageLink({
  page,
  search,
  isDisabled,
  children,
}: {
  readonly page: number;
  readonly search: string;
  readonly isDisabled: boolean;
  readonly children: ReactNode;
}) {
  const className =
    "inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium";

  if (isDisabled) {
    return (
      <span className={`${className} text-ink-muted opacity-50`}>
        {children}
      </span>
    );
  }

  const parameters = new URLSearchParams();

  if (search) {
    parameters.set("search", search);
  }

  if (page > 1) {
    parameters.set("page", String(page));
  }

  const query = parameters.toString();

  return (
    <Link
      href={`/account${query ? `?${query}` : ""}#propiedades-consultadas`}
      className={`${className} text-ink transition-colors hover:bg-muted`}
    >
      {children}
    </Link>
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
