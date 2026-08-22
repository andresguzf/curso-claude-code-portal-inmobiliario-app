"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import {
  AUTH_LIMITS,
  UserRole,
  type AdminUpdateUserRequestDto,
  type AdminUserDto,
} from "@portal/contracts";

import { fieldInputClassName } from "@/components/form/form-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { updateAdminUser } from "@/lib/api-client";
import { flashSuccess } from "@/lib/flash";
import { formatUserRole } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Administración de cuentas (spec.md, sección 21).
 *
 * Quien administra puede editar a cualquiera, cambiar su rol y dejarla dentro
 * o fuera. Sobre la **suya propia** no puede desactivarse ni dejar de ser
 * ADMIN: el registro público solo crea cuentas `USER`, así que hacerlo
 * dejaría el portal sin nadie que lo administre.
 *
 * Aquí esos controles ni se pintan, pero eso es cortesía: quien decide es el
 * backend, que responde 403 aunque se llame a la API a mano.
 */
export function UserManager({
  users,
  currentAdminId,
}: {
  readonly users: readonly AdminUserDto[];
  /** Quién está administrando, para no ofrecerle lo que no puede hacerse. */
  readonly currentAdminId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<{ id: string; message: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<{
    readonly user: AdminUserDto;
    readonly changes: AdminUpdateUserRequestDto;
    readonly title: string;
    readonly description: string;
    readonly confirmLabel: string;
  } | null>(null);

  function apply(
    user: AdminUserDto,
    changes: AdminUpdateUserRequestDto,
  ): Promise<boolean> {
    setError(null);

    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          await updateAdminUser(user.id, changes);
          flashSuccess(describeChange(user, changes));
          router.refresh();
          resolve(true);
        } catch (caught) {
          setError({
            id: user.id,
            message:
              caught instanceof Error
                ? caught.message
                : "No pudimos guardar los cambios.",
          });
          resolve(false);
        }
      });
    });
  }

  if (users.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
        Ninguna cuenta coincide con lo que has pedido.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {users.map((user) => (
          <li key={user.id}>
            <UserRow
              user={user}
              isSelf={user.id === currentAdminId}
              isEditing={editingId === user.id}
              isPending={isPending}
              errorMessage={error?.id === user.id ? error.message : null}
              onEdit={() => {
                setError(null);
                setEditingId(user.id);
              }}
              onCancelEdit={() => setEditingId(null)}
              onSave={async (changes) => {
                if (await apply(user, changes)) {
                  setEditingId(null);
                }
              }}
              onAskChange={setPendingChange}
            />
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={pendingChange !== null}
        title={pendingChange?.title ?? ""}
        description={pendingChange?.description ?? ""}
        confirmLabel={pendingChange?.confirmLabel ?? "Confirmar"}
        cancelLabel="Cancelar"
        pendingLabel="Guardando…"
        isPending={isPending}
        onConfirm={() => {
          const target = pendingChange;

          if (!target) {
            return;
          }

          setPendingChange(null);
          void apply(target.user, target.changes);
        }}
        onCancel={() => setPendingChange(null)}
      />
    </>
  );
}

/**
 * Qué decir según lo que se cambió.
 *
 * El texto sale del propio cuerpo enviado y no de quien llama: así una
 * pantalla nueva que use `apply` no puede olvidarse de describir su acción,
 * ni describirla de otra manera.
 *
 * La contraseña se menciona aparte porque es la única que obliga a hacer
 * algo después: comunicarla, o esa persona se queda fuera.
 */
function describeChange(
  user: AdminUserDto,
  changes: AdminUpdateUserRequestDto,
): string {
  if (changes.newPassword !== undefined) {
    return `Se cambió la contraseña de ${user.name}. Comunícasela: no hay forma de recuperarla desde aquí.`;
  }

  if (changes.isActive !== undefined) {
    return changes.isActive
      ? `${user.name} puede volver a entrar.`
      : `${user.name} ya no puede entrar.`;
  }

  if (changes.role !== undefined) {
    return changes.role === UserRole.ADMIN
      ? `${user.name} ahora administra el portal.`
      : `${user.name} ya no administra el portal.`;
  }

  return `Se guardaron los datos de ${changes.name ?? user.name}.`;
}

type PendingChange = {
  readonly user: AdminUserDto;
  readonly changes: AdminUpdateUserRequestDto;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
};

function UserRow({
  user,
  isSelf,
  isEditing,
  isPending,
  errorMessage,
  onEdit,
  onCancelEdit,
  onSave,
  onAskChange,
}: {
  readonly user: AdminUserDto;
  readonly isSelf: boolean;
  readonly isEditing: boolean;
  readonly isPending: boolean;
  readonly errorMessage: string | null;
  readonly onEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onSave: (changes: AdminUpdateUserRequestDto) => void;
  readonly onAskChange: (change: PendingChange) => void;
}) {
  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-56 flex-1 flex-col">
          <p className="font-medium break-words text-ink">
            {user.name}
            {isSelf ? (
              <span className="ml-2 text-xs font-normal text-ink-muted">
                (tu cuenta)
              </span>
            ) : null}
          </p>
          <p className="text-sm break-words text-ink-muted">{user.email}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {user.favoriteCount === 1
              ? "1 guardada"
              : `${user.favoriteCount} guardadas`}
            {" · "}
            {user.inquiryCount === 1
              ? "1 consulta"
              : `${user.inquiryCount} consultas`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Badge isStrong={isAdmin}>{formatUserRole(user.role)}</Badge>
          <Badge isStrong={false}>
            {user.isActive ? "Activa" : "Desactivada"}
          </Badge>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={isPending || isEditing}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium text-ink transition-colors hover:bg-muted disabled:cursor-progress disabled:opacity-70"
          >
            <span aria-hidden="true">Editar</span>
            <span className="sr-only">Editar la cuenta de {user.name}</span>
          </button>

          {/* Sobre la propia cuenta estos dos no se ofrecen: dejarían el
              portal sin administración y sin forma de recuperarla. */}
          {isSelf ? null : (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  onAskChange(
                    user.isActive
                      ? {
                          user,
                          changes: { isActive: false },
                          title: "Desactivar la cuenta",
                          description: `${user.name} dejará de poder entrar. Sus favoritos y sus consultas se conservan, y volverá a tenerlos al reactivarla.`,
                          confirmLabel: "Sí, desactivarla",
                        }
                      : {
                          user,
                          changes: { isActive: true },
                          title: "Reactivar la cuenta",
                          description: `${user.name} volverá a poder entrar con su contraseña de siempre.`,
                          confirmLabel: "Sí, reactivarla",
                        },
                  )
                }
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium text-ink-muted transition-colors hover:border-danger hover:text-danger disabled:cursor-progress"
              >
                <span aria-hidden="true">
                  {user.isActive ? "Desactivar" : "Reactivar"}
                </span>
                <span className="sr-only">
                  {user.isActive ? "Desactivar" : "Reactivar"} la cuenta de{" "}
                  {user.name}
                </span>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  onAskChange(
                    isAdmin
                      ? {
                          user,
                          changes: { role: UserRole.USER },
                          title: "Quitar la administración",
                          description: `${user.name} dejará de administrar el portal y pasará a ser un usuario normal.`,
                          confirmLabel: "Sí, quitársela",
                        }
                      : {
                          user,
                          changes: { role: UserRole.ADMIN },
                          title: "Dar acceso de administración",
                          description: `${user.name} podrá gestionar propiedades, imágenes, usuarios y consultas, y editar cualquier cuenta salvo desactivarse a sí misma.`,
                          confirmLabel: "Sí, darle acceso",
                        },
                  )
                }
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium text-ink transition-colors hover:bg-muted disabled:cursor-progress"
              >
                {/* El nombre accesible repite el verbo: la parte visible va
                    oculta a la asistencia, así que un «a María» suelto sería
                    todo lo que se oiría. */}
                <span aria-hidden="true">
                  {isAdmin ? "Quitar administración" : "Hacer administrador"}
                </span>
                <span className="sr-only">
                  {isAdmin ? "Quitar administración" : "Hacer administrador"} a{" "}
                  {user.name}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {isSelf ? (
        <p className="text-xs text-ink-muted">
          Sobre tu propia cuenta no puedes desactivarte ni quitarte el rol: el
          portal se quedaría sin administración y no habría forma de recuperarla
          desde aquí.
        </p>
      ) : null}

      {isEditing ? (
        <UserEditForm
          user={user}
          isPending={isPending}
          hasError={Boolean(errorMessage)}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      ) : null}

      {errorMessage ? (
        <p aria-live="polite" className="text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}
    </article>
  );
}

/**
 * Edición de los datos de una cuenta.
 *
 * No se pide la contraseña actual, a diferencia de `/account/edit`: quien
 * administra no la conoce. Es la contrapartida del rol, y por eso las reglas
 * que impiden autodesactivarse viven en el backend.
 *
 * La contraseña en blanco significa «no cambiarla», nunca «ponerla en
 * blanco».
 */
function UserEditForm({
  user,
  isPending,
  hasError,
  onSave,
  onCancel,
}: {
  readonly user: AdminUserDto;
  readonly isPending: boolean;
  readonly hasError: boolean;
  readonly onSave: (changes: AdminUpdateUserRequestDto) => void;
  readonly onCancel: () => void;
}) {
  const fieldId = useId();
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        const form = new FormData(event.currentTarget);
        const name = String(form.get("name") ?? "").trim();
        const email = String(form.get("email") ?? "").trim();
        const newPassword = String(form.get("newPassword") ?? "");

        onSave({
          name,
          email,
          // Vacío significa «no cambiarla»: no debe viajar.
          ...(newPassword ? { newPassword } : {}),
        });
      }}
      className="flex flex-col gap-4 border-t border-line pt-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`${fieldId}-name`}
            className="text-sm font-medium text-ink"
          >
            Nombre
          </label>
          <input
            ref={nameRef}
            id={`${fieldId}-name`}
            name="name"
            type="text"
            autoComplete="off"
            defaultValue={user.name}
            maxLength={AUTH_LIMITS.maxNameLength}
            className={fieldInputClassName(hasError)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor={`${fieldId}-email`}
            className="text-sm font-medium text-ink"
          >
            Email
          </label>
          <input
            id={`${fieldId}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            spellCheck={false}
            defaultValue={user.email}
            maxLength={AUTH_LIMITS.maxEmailLength}
            className={fieldInputClassName(hasError)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${fieldId}-password`}
          className="text-sm font-medium text-ink"
        >
          Contraseña nueva
          <span className="ml-2 font-normal text-ink-muted">
            Opcional · en blanco, se queda la que tenía
          </span>
        </label>
        <input
          id={`${fieldId}-password`}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          maxLength={AUTH_LIMITS.maxPasswordLength}
          className={fieldInputClassName(hasError)}
        />
        <p className="text-xs text-ink-muted">
          No hace falta la contraseña actual: quien administra no la conoce.
          Cambiarla deja fuera a esa persona hasta que le comuniques la nueva.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong disabled:cursor-progress"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/**
 * Distintivo de rol o de estado.
 *
 * El texto no depende solo del color: «Desactivada» se lee, así que quien no
 * distinga los tonos entiende igual la diferencia.
 */
function Badge({
  isStrong,
  children,
}: {
  readonly isStrong: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        isStrong ? "bg-accent-soft text-ink" : "bg-muted text-ink-muted",
      )}
    >
      {children}
    </span>
  );
}
