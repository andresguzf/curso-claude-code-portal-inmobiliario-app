import { cookies } from "next/headers";

import {
  ADMIN_USER_QUERY_PARAM_NAMES,
  AdminUserStatus,
  UserRole,
  type AdminUserPageDto,
} from "@portal/contracts";

import { UserManager } from "@/components/admin/user-manager";
import { Pagination } from "@/components/ui/pagination";
import { SearchForm } from "@/components/ui/search-form";
import { fetchAdminUsers } from "@/lib/api-client";
import { formatUserRole } from "@/lib/format";
import { requireAdminUser } from "@/lib/require-user";

/** El listado refleja el estado vigente de cada cuenta. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Usuarios",
};

const USERS_PATH = "/admin/users";

type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Administración de usuarios (spec.md, sección 21).
 *
 * ADMIN puede editar a cualquiera, cambiar su rol y dejarla dentro o fuera.
 * Sobre su propia cuenta no puede desactivarse ni dejar de ser ADMIN: el
 * registro público solo crea cuentas `USER`, y hacerlo dejaría el portal sin
 * administración.
 *
 * Aquí esos controles no se pintan para su propia fila, pero la regla la
 * aplica el backend: esconder un botón es cortesía, no protección.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  readonly searchParams: Promise<RawSearchParams>;
}) {
  const admin = await requireAdminUser(USERS_PATH);

  const parameters = toSearchParams(await searchParams);
  const search = parameters.get(ADMIN_USER_QUERY_PARAM_NAMES.search) ?? "";
  const result = await loadUsers(parameters);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Las cuentas del portal. Puedes editarlas, cambiarles el rol y dejarlas
        dentro o fuera.
      </p>

      <SearchForm
        basePath={USERS_PATH}
        search={search}
        label="Buscar usuarios"
        placeholder="Nombre o email…"
        className="mt-6"
      />

      <Filters parameters={parameters} search={search} />

      <div className="mt-4">
        {result === null ? (
          <p className="rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
            No pudimos cargar los usuarios con esos filtros. Revisa la dirección
            o quítalos y vuelve a intentarlo.
          </p>
        ) : (
          <>
            <UserManager users={result.data} currentAdminId={admin.id} />

            {result.data.length > 0 ? (
              <p className="mt-3 text-sm text-ink-muted">
                {result.total === 1 ? "1 cuenta" : `${result.total} cuentas`}
              </p>
            ) : null}

            <Pagination
              basePath={USERS_PATH}
              currentPage={result.page}
              lastPage={Math.max(1, Math.ceil(result.total / result.pageSize))}
              preserved={parameters}
              label="Páginas de usuarios"
            />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Filtros por rol y estado.
 *
 * Son enlaces y no un formulario: con dos filtros de tres opciones cada uno,
 * un panel plegable sería más maquinaria que la que hace falta. Al ser
 * enlaces, además, se pueden abrir en otra pestaña.
 */
function Filters({
  parameters,
  search,
}: {
  readonly parameters: URLSearchParams;
  readonly search: string;
}) {
  const names = ADMIN_USER_QUERY_PARAM_NAMES;
  const currentRole = parameters.get(names.role) ?? "";
  const currentStatus = parameters.get(names.status) ?? AdminUserStatus.ALL;

  function hrefFor(name: string, value: string): string {
    const next = new URLSearchParams();

    if (search) {
      next.set(names.search, search);
    }

    for (const other of [names.role, names.status]) {
      const existing = parameters.get(other);

      if (other !== name && existing) {
        next.set(other, existing);
      }
    }

    if (value) {
      next.set(name, value);
    }

    // Filtrar de nuevo empieza por la primera página: la que se estaba
    // viendo no tiene por qué existir en el resultado filtrado.
    const query = next.toString();

    return `${USERS_PATH}${query ? `?${query}` : ""}`;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-6">
      <FilterGroup
        label="Rol"
        options={[
          { value: "", label: "Todos", isActive: currentRole === "" },
          ...Object.values(UserRole).map((role) => ({
            value: role,
            label: formatUserRole(role),
            isActive: currentRole === role,
          })),
        ]}
        hrefFor={(value) => hrefFor(names.role, value)}
      />

      <FilterGroup
        label="Estado"
        options={[
          {
            value: "",
            label: "Todas",
            isActive:
              currentStatus === AdminUserStatus.ALL || currentStatus === "",
          },
          {
            value: AdminUserStatus.ACTIVE,
            label: "Activas",
            isActive: currentStatus === AdminUserStatus.ACTIVE,
          },
          {
            value: AdminUserStatus.INACTIVE,
            label: "Desactivadas",
            isActive: currentStatus === AdminUserStatus.INACTIVE,
          },
        ]}
        hrefFor={(value) => hrefFor(names.status, value)}
      />
    </div>
  );
}

function FilterGroup({
  label,
  options,
  hrefFor,
}: {
  readonly label: string;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
    readonly isActive: boolean;
  }[];
  readonly hrefFor: (value: string) => string;
}) {
  return (
    <nav aria-label={`Filtrar por ${label.toLowerCase()}`}>
      <p className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {label}
      </p>
      <ul className="flex flex-wrap gap-1">
        {options.map((option) => (
          <li key={option.value || "todos"}>
            <a
              href={hrefFor(option.value)}
              aria-current={option.isActive ? "true" : undefined}
              className={
                option.isActive
                  ? "inline-flex min-h-9 items-center rounded-lg bg-accent-soft px-3 text-sm font-medium text-ink"
                  : "inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-muted hover:text-ink"
              }
            >
              {option.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
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
 * Un fallo al consultarlos no debe tumbar el panel: se devuelve `null` y la
 * página lo dice, en vez de una lista vacía que se leería como «no hay
 * cuentas». También llega aquí un filtro inválido escrito a mano en la URL.
 */
async function loadUsers(
  parameters: URLSearchParams,
): Promise<AdminUserPageDto | null> {
  try {
    return await fetchAdminUsers(parameters, (await cookies()).toString());
  } catch (error) {
    console.error("[admin] No fue posible cargar los usuarios", error);

    return null;
  }
}
