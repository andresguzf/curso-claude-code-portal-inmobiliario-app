import { cookies } from "next/headers";
import Link from "next/link";

import {
  ADMIN_INQUIRY_QUERY_PARAM_NAMES,
  type AdminInquiryDto,
  type AdminInquiryPageDto,
} from "@portal/contracts";

import { Pagination } from "@/components/ui/pagination";
import { SearchForm } from "@/components/ui/search-form";
import { fetchAdminInquiries } from "@/lib/api-client";
import { requireAdminUser } from "@/lib/require-user";
import { cn } from "@/lib/utils";

/** Las consultas llegan en cualquier momento. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Consultas",
};

const INQUIRIES_PATH = "/admin/inquiries";

type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Consultas recibidas (spec.md, sección 22).
 *
 * Están **todas**: las de visitantes sin cuenta, las que su autor quitó de su
 * historial y las de propiedades despublicadas o eliminadas. Ese es el motivo
 * por el que ambos borrados son lógicos —una consulta es un contacto
 * comercial que hay que poder responder—, y esta es la pantalla donde eso se
 * hace visible.
 *
 * No hay controles: aquí no se edita nada. Responder ocurre por correo o por
 * teléfono, y los enlaces llevan directamente a ello.
 */
export default async function AdminInquiriesPage({
  searchParams,
}: {
  readonly searchParams: Promise<RawSearchParams>;
}) {
  await requireAdminUser(INQUIRIES_PATH);

  const parameters = toSearchParams(await searchParams);
  const search = parameters.get(ADMIN_INQUIRY_QUERY_PARAM_NAMES.search) ?? "";
  const result = await loadInquiries(parameters);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Consultas</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Todo lo que ha escrito la gente sobre las propiedades, de lo más
        reciente a lo más antiguo.
      </p>

      <SearchForm
        basePath={INQUIRIES_PATH}
        search={search}
        label="Buscar consultas"
        placeholder="Nombre, email, texto del mensaje o propiedad…"
        className="mt-6"
      />

      <div className="mt-4">
        {result === null ? (
          <p className="rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
            No pudimos cargar las consultas en este momento. Vuelve a intentarlo
            en unos minutos.
          </p>
        ) : (
          <Listing page={result} parameters={parameters} search={search} />
        )}
      </div>
    </div>
  );
}

function Listing({
  page,
  parameters,
  search,
}: {
  readonly page: AdminInquiryPageDto;
  readonly parameters: URLSearchParams;
  readonly search: string;
}) {
  if (page.data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
        {search
          ? `Ninguna consulta coincide con «${search}».`
          : "Todavía no ha llegado ninguna consulta."}
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {page.data.map((inquiry) => (
          <li key={inquiry.id}>
            <InquiryCard inquiry={inquiry} />
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm text-ink-muted">
        {page.total === 1 ? "1 consulta" : `${page.total} consultas`}
      </p>

      <Pagination
        basePath={INQUIRIES_PATH}
        currentPage={page.page}
        lastPage={Math.max(1, Math.ceil(page.total / page.pageSize))}
        preserved={parameters}
        label="Páginas de consultas"
      />
    </>
  );
}

function InquiryCard({ inquiry }: { readonly inquiry: AdminInquiryDto }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-56 flex-1">
          <PropertyLink property={inquiry.property} />

          <p className="mt-1 text-xs text-ink-muted">
            <time dateTime={inquiry.createdAt}>
              {formatInquiryDate(inquiry.createdAt)}
            </time>
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          {inquiry.property.isDeleted ? (
            <Badge>Propiedad eliminada</Badge>
          ) : inquiry.property.isPublished ? null : (
            <Badge>Propiedad en borrador</Badge>
          )}
          {inquiry.isHiddenByUser ? (
            <Badge>Oculta en su historial</Badge>
          ) : null}
        </div>
      </div>

      <p className="text-sm break-words whitespace-pre-line text-ink">
        {inquiry.message}
      </p>

      <Contact inquiry={inquiry} />
    </article>
  );
}

/**
 * A dónde lleva la consulta.
 *
 * Al formulario de la propiedad y no a su ficha pública: es donde se puede
 * ver todo y actuar, y funciona también con un borrador, que públicamente
 * responde 404.
 *
 * Una propiedad eliminada no tiene a dónde llevar, así que se nombra sin
 * enlace en vez de ofrecer uno que acabaría en «no existe».
 */
function PropertyLink({
  property,
}: {
  readonly property: AdminInquiryDto["property"];
}) {
  if (property.isDeleted) {
    return (
      <p className="font-medium break-words text-ink-muted">{property.title}</p>
    );
  }

  return (
    <h2 className="text-base font-semibold break-words text-ink">
      <Link
        href={`/admin/properties/${property.id}/edit`}
        className="underline-offset-4 hover:underline"
      >
        {property.title}
      </Link>
    </h2>
  );
}

/**
 * Cómo responder.
 *
 * El nombre y el email son los que se escribieron en el formulario, que no
 * tienen por qué coincidir con los de la cuenta: si hay cuenta asociada y sus
 * datos difieren, se dicen los dos.
 */
function Contact({ inquiry }: { readonly inquiry: AdminInquiryDto }) {
  const differsFromAccount =
    inquiry.user !== null &&
    (inquiry.user.name !== inquiry.name ||
      inquiry.user.email !== inquiry.email);

  return (
    <div className="flex flex-col gap-1 border-t border-line pt-3 text-sm">
      <p className="text-ink">
        <span className="font-medium">{inquiry.name}</span>{" "}
        <a
          href={`mailto:${inquiry.email}`}
          className="text-ink-muted underline underline-offset-4 hover:text-accent"
        >
          {inquiry.email}
        </a>
        {inquiry.phone ? (
          <>
            {" · "}
            <a
              href={`tel:${inquiry.phone.replace(/\s+/g, "")}`}
              className="text-ink-muted underline underline-offset-4 hover:text-accent"
            >
              {inquiry.phone}
            </a>
          </>
        ) : null}
      </p>

      <p className="text-xs text-ink-muted">
        {inquiry.user === null
          ? "Sin cuenta: la envió un visitante."
          : differsFromAccount
            ? // Sin plantilla, el salto de línea de JSX deja «( email )».
              `Cuenta: ${inquiry.user.name} (${inquiry.user.email})`
            : "Con cuenta en el portal."}
      </p>
    </div>
  );
}

function Badge({ children }: { readonly children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium whitespace-nowrap text-ink-muted",
      )}
    >
      {children}
    </span>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatInquiryDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(isoDate));
}

/** Un parámetro repetido en la URL se queda con el primero. */
function toSearchParams(raw: RawSearchParams): URLSearchParams {
  const parameters = new URLSearchParams();

  for (const [name, value] of Object.entries(raw)) {
    const single = Array.isArray(value) ? value[0] : value;

    if (single) {
      parameters.set(name, single);
    }
  }

  return parameters;
}

/**
 * Un fallo al consultarlas no debe tumbar el panel: se devuelve `null` y la
 * página lo dice, en vez de una lista vacía que se leería como «no ha
 * escrito nadie».
 */
async function loadInquiries(
  parameters: URLSearchParams,
): Promise<AdminInquiryPageDto | null> {
  try {
    return await fetchAdminInquiries(parameters, (await cookies()).toString());
  } catch (error) {
    console.error("[admin] No fue posible cargar las consultas", error);

    return null;
  }
}
