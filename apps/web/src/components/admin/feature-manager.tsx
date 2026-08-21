"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";

import { FEATURE_LIMITS, type AdminFeatureDto } from "@portal/contracts";

import { fieldInputClassName } from "@/components/form/form-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createAdminFeature,
  deleteAdminFeature,
  renameAdminFeature,
} from "@/lib/api-client";

/**
 * Alta, cambio de nombre y baja de características (spec.md, sección 4).
 *
 * Existe para que añadir «piscina temperada» sea dar de alta un registro y no
 * tocar el esquema: `Property` no tiene una columna por característica, y esa
 * es justamente la propiedad del modelo que esta pantalla protege.
 *
 * Cada acción se guarda al instante. No hay borrador que perder: son nombres
 * sueltos, no una ficha con quince campos.
 */
export function FeatureManager({
  features,
}: {
  readonly features: readonly AdminFeatureDto[];
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [featureToRemove, setFeatureToRemove] =
    useState<AdminFeatureDto | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  /** Envuelve una acción: limpia el aviso, refresca y traduce el fallo. */
  function run(action: () => Promise<void>, fallbackMessage: string) {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : fallbackMessage,
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <CreateForm
        isPending={isPending}
        onCreate={(name) =>
          run(
            () => createAdminFeature(name).then(() => undefined),
            "No pudimos crear la característica.",
          )
        }
      />

      {features.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
          Todavía no hay características. Crea la primera.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead className="border-b border-line text-xs tracking-wide text-ink-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Nombre
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Identificador
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Propiedades
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {features.map((feature) => (
                <FeatureRow
                  key={feature.id}
                  feature={feature}
                  isEditing={editingId === feature.id}
                  isPending={isPending}
                  onEdit={() => {
                    setErrorMessage(null);
                    setEditingId(feature.id);
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onRename={(name) => {
                    setEditingId(null);
                    run(
                      () =>
                        renameAdminFeature(feature.id, name).then(
                          () => undefined,
                        ),
                      "No pudimos guardar el nombre.",
                    );
                  }}
                  onRemove={() => setFeatureToRemove(feature)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p aria-live="polite" className="text-sm text-danger">
        {errorMessage}
      </p>

      <ConfirmDialog
        isOpen={featureToRemove !== null}
        title="Eliminar la característica"
        description={describeRemoval(featureToRemove)}
        confirmLabel="Sí, eliminarla"
        cancelLabel="No, conservarla"
        pendingLabel="Eliminando…"
        isPending={isPending}
        onConfirm={() => {
          const target = featureToRemove;

          if (!target) {
            return;
          }

          setFeatureToRemove(null);
          run(
            () => deleteAdminFeature(target.id),
            "No pudimos eliminar la característica.",
          );
        }}
        onCancel={() => setFeatureToRemove(null)}
      />
    </div>
  );
}

/**
 * Qué va a pasar exactamente al eliminar.
 *
 * Se dice a cuántas propiedades afecta, con el número delante: «dejará de
 * figurar» a secas oculta que esto toca fichas que ya están publicadas.
 */
function describeRemoval(feature: AdminFeatureDto | null): string {
  if (!feature) {
    return "";
  }

  if (feature.propertyCount === 0) {
    return `«${feature.name}» no la usa ninguna propiedad. Dejará de ofrecerse en el formulario.`;
  }

  const propiedades =
    feature.propertyCount === 1
      ? "1 propiedad dejará"
      : `${feature.propertyCount} propiedades dejarán`;

  return `${propiedades} de declarar «${feature.name}», y dejará de ofrecerse en el formulario. No se pierde ningún otro dato de esas fichas.`;
}

function CreateForm({
  isPending,
  onCreate,
}: {
  readonly isPending: boolean;
  readonly onCreate: (name: string) => void;
}) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        const name = inputRef.current?.value.trim() ?? "";

        if (name === "") {
          return;
        }

        onCreate(name);

        // El campo se vacía para poder encadenar varias de una sentada.
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex min-w-56 flex-1 flex-col gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          Nueva característica
        </label>
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          name="name"
          autoComplete="off"
          maxLength={FEATURE_LIMITS.maxNameLength}
          placeholder="Piscina temperada, sala de juegos…"
          className={fieldInputClassName(false)}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong disabled:cursor-progress disabled:opacity-70"
      >
        Añadir
      </button>
    </form>
  );
}

function FeatureRow({
  feature,
  isEditing,
  isPending,
  onEdit,
  onCancelEdit,
  onRename,
  onRemove,
}: {
  readonly feature: AdminFeatureDto;
  readonly isEditing: boolean;
  readonly isPending: boolean;
  readonly onEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onRename: (name: string) => void;
  readonly onRemove: () => void;
}) {
  const fieldId = useId();

  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="px-4 py-3">
        {isEditing ? (
          <form
            id={`${fieldId}-form`}
            onSubmit={(event) => {
              event.preventDefault();

              const value = new FormData(event.currentTarget).get("name");

              if (typeof value === "string" && value.trim()) {
                onRename(value.trim());
              }
            }}
          >
            <label htmlFor={fieldId} className="sr-only">
              Nombre de {feature.name}
            </label>
            <input
              id={fieldId}
              name="name"
              type="text"
              autoComplete="off"
              defaultValue={feature.name}
              maxLength={FEATURE_LIMITS.maxNameLength}
              // Quien pulsó «Renombrar» quiere escribir aquí, y sin esto
              // tendría que buscar el campo que él mismo acaba de abrir.
              autoFocus
              className={`${fieldInputClassName(false)} text-sm`}
            />
          </form>
        ) : (
          <span className="font-medium text-ink">{feature.name}</span>
        )}
      </td>

      <td className="px-4 py-3">
        <code className="text-xs text-ink-muted">{feature.slug}</code>
      </td>

      <td className="px-4 py-3 text-ink-muted tabular-nums">
        {feature.propertyCount}
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap justify-end gap-2">
          {isEditing ? (
            <>
              <button
                type="submit"
                form={`${fieldId}-form`}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-3 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong disabled:cursor-progress"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium text-ink transition-colors hover:bg-muted"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onEdit}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium text-ink transition-colors hover:bg-muted disabled:cursor-progress"
              >
                <span aria-hidden="true">Renombrar</span>
                <span className="sr-only">Renombrar {feature.name}</span>
              </button>
              <button
                type="button"
                onClick={onRemove}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium text-ink-muted transition-colors hover:border-danger hover:text-danger disabled:cursor-progress"
              >
                <span aria-hidden="true">Eliminar</span>
                <span className="sr-only">Eliminar {feature.name}</span>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
