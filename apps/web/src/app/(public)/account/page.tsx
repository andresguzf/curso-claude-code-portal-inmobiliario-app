import { cookies } from "next/headers";
import Link from "next/link";

import type {
  AuthenticatedUserDto,
  PropertyListDto,
  UserInquiryPageDto,
} from "@portal/contracts";

import { InquiryHistory } from "@/components/account/inquiry-history";
import { PropertyGrid } from "@/components/property/property-grid";
import { fetchFavorites, fetchUserInquiries } from "@/lib/api-client";
import { formatUserRole } from "@/lib/format";
import { requireStandardUser } from "@/lib/require-user";

/** La cuenta refleja la sesión vigente en cada visita. */
export const dynamic = "force-dynamic";

/** El layout añade el sufijo del sitio mediante su plantilla de título. */
export const metadata = {
  title: "Mi cuenta",
};

const ACCOUNT_PATH = "/account";

/**
 * Área privada de la persona usuaria (spec.md, sección 17).
 *
 * La guarda decide antes de pintar nada: sin sesión se va al login con el
 * destino recordado. El `middleware` ya filtró la ausencia de cookie, pero la
 * comprobación con autoridad es esta, porque pregunta al backend.
 *
 * Las secciones de propiedades interesadas y consultadas quedan montadas con
 * su estado vacío. Los favoritos llegan en el paso 20 y las consultas se
 * empiezan a guardar en el paso 21.
 */
export default async function AccountPage({
  searchParams,
}: PageProps<"/account">) {
  const user = await requireStandardUser(ACCOUNT_PATH);
  const { search, page } = readHistoryParams(await searchParams);
  const cookieHeader = (await cookies()).toString();

  const [favorites, inquiries] = await Promise.all([
    loadList(() => fetchFavorites(cookieHeader), "guardadas"),
    loadList(
      () => fetchUserInquiries({ search, page }, cookieHeader),
      "consultadas",
    ),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Mi cuenta</h1>

        <Link
          href="/account/edit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line-strong px-4 text-sm font-semibold text-ink transition-colors hover:bg-muted"
        >
          Editar datos
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        <AccountDetails user={user} />

        {favorites && favorites.total > 0 ? (
          <section aria-labelledby="propiedades-interesadas">
            <h2
              id="propiedades-interesadas"
              className="text-xl font-semibold tracking-tight"
            >
              Propiedades interesadas
            </h2>

            <PropertyGrid
              properties={favorites.data}
              favoritePropertyIds={
                new Set(favorites.data.map((property) => property.id))
              }
              className="mt-4 sm:grid-cols-2 lg:grid-cols-2"
            />
          </section>
        ) : (
          <EmptySection
            id="propiedades-interesadas"
            title="Propiedades interesadas"
            description="Todavía no has guardado ninguna propiedad. Guarda las que te interesen para volver a ellas sin buscarlas de nuevo."
          />
        )}

        {inquiries ? (
          <InquiryHistory page={inquiries} search={search} />
        ) : (
          <EmptySection
            id="propiedades-consultadas"
            title="Mis consultas"
            description="No pudimos cargar tus consultas en este momento. Vuelve a intentarlo en unos minutos."
          />
        )}
      </div>
    </div>
  );
}

function AccountDetails({ user }: { readonly user: AuthenticatedUserDto }) {
  return (
    <section aria-labelledby="datos-de-la-cuenta">
      <h2
        id="datos-de-la-cuenta"
        className="text-xl font-semibold tracking-tight"
      >
        Datos
      </h2>

      <dl className="mt-4 grid gap-4 rounded-xl border border-line bg-card p-5 sm:grid-cols-3 sm:p-6">
        <Detail label="Nombre" value={user.name} />
        <Detail label="Email" value={user.email} />
        <Detail label="Perfil" value={formatUserRole(user.role)} />
      </dl>
    </section>
  );
}

function Detail({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide uppercase text-ink-muted">
        {label}
      </dt>
      <dd className="text-base break-words text-ink">{value}</dd>
    </div>
  );
}

/**
 * Sección todavía sin contenido.
 *
 * El texto describe la situación real de quien lo lee —no ha guardado nada
 * aún—, no el estado del desarrollo. Cuando lleguen los datos solo cambia lo
 * que se pinta cuando los hay.
 */
function EmptySection({
  id,
  title,
  description,
}: {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-xl font-semibold tracking-tight">
        {title}
      </h2>

      <div className="mt-4 rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center">
        <p className="text-sm text-ink-muted">{description}</p>

        <Link
          href="/properties"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong"
        >
          Explorar propiedades
        </Link>
      </div>
    </section>
  );
}

/**
 * Una lista de la cuenta.
 *
 * Un fallo al consultarla no debe tumbar la página entera: se devuelve `null`
 * y esa sección muestra su estado vacío.
 */
async function loadList<TList extends PropertyListDto | UserInquiryPageDto>(
  load: () => Promise<TList>,
  description: string,
): Promise<TList | null> {
  try {
    return await load();
  } catch (error) {
    console.error(`[cuenta] No fue posible cargar las ${description}`, error);

    return null;
  }
}

/** Búsqueda y página del historial, tal como llegan en la URL. */
function readHistoryParams(
  parameters: Record<string, string | string[] | undefined>,
) {
  const read = (name: string) => {
    const value = parameters[name];

    return (Array.isArray(value) ? value[0] : value) ?? "";
  };

  return { search: read("search").trim(), page: Number(read("page")) || 1 };
}
