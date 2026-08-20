"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

import {
  fieldErrorAttributes,
  fieldInputClassName,
  FormField,
} from "@/components/form/form-field";
import { updateAccount } from "@/lib/api-client";
import {
  accountUpdateSchema,
  type AccountUpdateFormValues,
} from "@/schemas/auth-schema";

/**
 * Edición de la propia cuenta (spec.md, sección 17).
 *
 * Solo nombre, email y contraseña. El rol y el estado no aparecen porque no
 * se pueden cambiar desde aquí: los decide ADMIN.
 *
 * La contraseña actual se pide siempre, también para cambiar solo el nombre.
 * Es una regla única y sin excepciones: cualquier cambio exige demostrar que
 * quien lo hace es la persona dueña de la cuenta.
 */
export function AccountForm({
  name,
  email,
  redirectTo = "/account",
}: {
  /** Solo lo que el formulario edita: el rol no viaja al navegador. */
  readonly name: string;
  readonly email: string;
  /** A dónde volver tras guardar. El panel y la cuenta no comparten ruta. */
  readonly redirectTo?: string;
}) {
  const fieldId = useId();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountUpdateFormValues>({
    resolver: zodResolver(accountUpdateSchema),
    defaultValues: { name, email, currentPassword: "", newPassword: "" },
  });

  async function onSubmit(values: AccountUpdateFormValues) {
    setErrorMessage(null);

    try {
      await updateAccount({
        name: values.name,
        email: values.email,
        currentPassword: values.currentPassword,
        // Vacío significa «no cambiarla»: no debe viajar.
        ...(values.newPassword ? { newPassword: values.newPassword } : {}),
      });

      router.replace(redirectTo);
      // El nombre también vive en la cabecera, que pinta el servidor.
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No pudimos guardar los cambios.",
      );
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
    >
      <FormField
        id={`${fieldId}-name`}
        label="Nombre"
        error={errors.name?.message}
      >
        <input
          id={`${fieldId}-name`}
          type="text"
          autoComplete="name"
          className={fieldInputClassName(Boolean(errors.name))}
          {...fieldErrorAttributes(`${fieldId}-name`, Boolean(errors.name))}
          {...register("name")}
        />
      </FormField>

      <FormField
        id={`${fieldId}-email`}
        label="Email"
        error={errors.email?.message}
      >
        <input
          id={`${fieldId}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          className={fieldInputClassName(Boolean(errors.email))}
          {...fieldErrorAttributes(`${fieldId}-email`, Boolean(errors.email))}
          {...register("email")}
        />
      </FormField>

      <FormField
        id={`${fieldId}-new-password`}
        label="Contraseña nueva"
        hint="Opcional · déjala en blanco para no cambiarla"
        error={errors.newPassword?.message}
      >
        <input
          id={`${fieldId}-new-password`}
          type="password"
          autoComplete="new-password"
          className={fieldInputClassName(Boolean(errors.newPassword))}
          {...fieldErrorAttributes(
            `${fieldId}-new-password`,
            Boolean(errors.newPassword),
          )}
          {...register("newPassword")}
        />
      </FormField>

      <FormField
        id={`${fieldId}-current-password`}
        label="Contraseña actual"
        hint="Necesaria para guardar"
        error={errors.currentPassword?.message}
      >
        <input
          id={`${fieldId}-current-password`}
          type="password"
          autoComplete="current-password"
          className={fieldInputClassName(Boolean(errors.currentPassword))}
          {...fieldErrorAttributes(
            `${fieldId}-current-password`,
            Boolean(errors.currentPassword),
          )}
          {...register("currentPassword")}
        />
      </FormField>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong disabled:cursor-progress disabled:opacity-70"
        >
          {isSubmitting ? "Guardando…" : "Guardar cambios"}
        </button>

        <p aria-live="polite" className="text-sm text-accent-strong">
          {errorMessage}
        </p>
      </div>
    </form>
  );
}
