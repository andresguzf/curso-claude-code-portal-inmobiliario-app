"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { FEATURE_LIMITS, type AdminFeatureDto } from "@portal/contracts";

import { fieldInputClassName } from "@/components/form/form-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createAdminFeature,
  deleteAdminFeature,
  renameAdminFeature,
} from "@/lib/api-client";
import { flashSuccess } from "@/lib/flash";

/**
 * Alta, cambio de nombre y baja de características (spec.md, sección 4).
 *
 * Existe para que añadir «piscina temperada» sea dar de alta un registro y no
 * tocar el esquema: `Property` no tiene una columna por característica, y esa
 * es justamente la propiedad del modelo que esta pantalla protege.
 *
 * Se pinta como lista y no como tabla: son cuatro datos por fila y ninguno
 * se compara entre filas. Una tabla obligaba a desplazarse en horizontal a
 * poca anchura, y los botones quedaban fuera de la parte visible.
 */

/**
 * Dónde mostrar un fallo.
 *
 * El aviso vive junto al control que lo provocó, no al final de la página:
 * con catorce características, un mensaje al pie queda fuera de la pantalla
 * y la operación parece no haber hecho nada.
 */
type FeatureError = {
  /** `"create"` o el identificador de la característica afectada. */
  readonly scope: string;
  readonly message: string;
};

export function FeatureManager({
  features,
}: {
  readonly features: readonly AdminFeatureDto[];
}) {
  const router = useRouter();
  const [error, setError] = useState<FeatureError | null>(null);
  const [isPending, startTransition] = useTransition();
  const [featureToRemove, setFeatureToRemove] =
    useState<AdminFeatureDto | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  /**
   * Ejecuta una acción y avisa de si salió bien.
   *
   * Devuelve una promesa para que quien llama decida qué hacer después: al
   * renombrar, la fila solo debe cerrarse si se guardó.
   */
  function run(
    scope: string,
    action: () => Promise<void>,
    fallbackMessage: string,
    successMessage: string,
  ): Promise<boolean> {
    setError(null);

    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          await action();
          flashSuccess(successMessage);
          router.refresh();
          resolve(true);
        } catch (caught) {
          setError({
            scope,
            message: caught instanceof Error ? caught.message : fallbackMessage,
          });
          resolve(false);
        }
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <CreateForm
        isPending={isPending}
        errorMessage={error?.scope === "create" ? error.message : null}
        onCreate={(name) =>
          run(
            "create",
            () => createAdminFeature(name).then(() => undefined),
            "No pudimos crear la característica.",
            `«${name}» ya está disponible para las propiedades.`,
          )
        }
      />

      {features.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
          Todavía no hay características. Crea la primera.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {features.map((feature) => (
            <li key={feature.id}>
              <FeatureRow
                feature={feature}
                isEditing={editingId === feature.id}
                isPending={isPending}
                errorMessage={
                  error?.scope === feature.id ? error.message : null
                }
                onEdit={() => {
                  setError(null);
                  setEditingId(feature.id);
                }}
                onCancelEdit={() => setEditingId(null)}
                onRename={async (name) => {
                  const saved = await run(
                    feature.id,
                    () =>
                      renameAdminFeature(feature.id, name).then(
                        () => undefined,
                      ),
                    "No pudimos guardar el nombre.",
                    `Ahora se llama «${name}».`,
                  );

                  // Solo se cierra si se guardó: si falla, lo escrito sigue
                  // ahí para corregirlo, en vez de perderse.
                  if (saved) {
                    setEditingId(null);
                  }
                }}
                onRemove={() => setFeatureToRemove(feature)}
              />
            </li>
          ))}
        </ul>
      )}

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
          void run(
            target.id,
            () => deleteAdminFeature(target.id),
            "No pudimos eliminar la característica.",
            `«${target.name}» dejó de figurar en las propiedades.`,
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
  errorMessage,
  onCreate,
}: {
  readonly isPending: boolean;
  readonly errorMessage: string | null;
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
      className="flex flex-col gap-2"
    >
      <div className="flex flex-wrap items-end gap-3">
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
            className={fieldInputClassName(Boolean(errorMessage))}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong disabled:cursor-progress disabled:opacity-70"
        >
          Añadir
        </button>
      </div>

      <p aria-live="polite" className="text-sm text-danger">
        {errorMessage}
      </p>
    </form>
  );
}

/**
 * Campo para escribir el nombre nuevo.
 *
 * El foco y la selección se piden a mano en un efecto, no con `autoFocus`:
 * ese atributo enfoca antes de que React tenga puesto su escuchador, así que
 * un `onFocus` que seleccione el texto no llega a ejecutarse. Comprobado en
 * el navegador, donde el cursor quedaba al final en vez de sobre el texto.
 */
function RenameForm({
  fieldId,
  feature,
  isPending,
  hasError,
  onRename,
  onCancel,
}: {
  readonly fieldId: string;
  readonly feature: AdminFeatureDto;
  readonly isPending: boolean;
  readonly hasError: boolean;
  readonly onRename: (name: string) => void;
  readonly onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    input.focus();
    // Lo habitual al renombrar es reemplazar, no añadir al final.
    input.select();
  }, []);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        const value = new FormData(event.currentTarget).get("name");

        if (typeof value === "string" && value.trim()) {
          onRename(value.trim());
        }
      }}
      className="flex min-w-56 flex-1 flex-wrap items-center gap-2"
    >
      <label htmlFor={fieldId} className="sr-only">
        Nombre de {feature.name}
      </label>
      <input
        ref={inputRef}
        id={fieldId}
        name="name"
        type="text"
        autoComplete="off"
        defaultValue={feature.name}
        maxLength={FEATURE_LIMITS.maxNameLength}
        className={`${fieldInputClassName(hasError)} flex-1 text-sm`}
      />

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
    </form>
  );
}

function FeatureRow({
  feature,
  isEditing,
  isPending,
  errorMessage,
  onEdit,
  onCancelEdit,
  onRename,
  onRemove,
}: {
  readonly feature: AdminFeatureDto;
  readonly isEditing: boolean;
  readonly isPending: boolean;
  readonly errorMessage: string | null;
  readonly onEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onRename: (name: string) => void;
  readonly onRemove: () => void;
}) {
  const fieldId = useId();

  return (
    <article className="flex flex-col gap-2 rounded-xl border border-line bg-card p-3">
      <div className="flex flex-wrap items-center gap-3">
        {isEditing ? (
          <RenameForm
            fieldId={fieldId}
            feature={feature}
            isPending={isPending}
            hasError={Boolean(errorMessage)}
            onRename={onRename}
            onCancel={onCancelEdit}
          />
        ) : (
          <>
            <div className="flex min-w-48 flex-1 flex-col">
              <span className="font-medium text-ink">{feature.name}</span>
              <code className="text-xs text-ink-muted">{feature.slug}</code>
            </div>

            <p className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
              {feature.propertyCount === 1
                ? "1 propiedad"
                : `${feature.propertyCount} propiedades`}
            </p>

            <div className="flex gap-2">
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
            </div>
          </>
        )}
      </div>

      {errorMessage ? (
        <p aria-live="polite" className="text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}
    </article>
  );
}
