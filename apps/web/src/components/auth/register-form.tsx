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
import { registerAccount } from "@/lib/api-client";
import { flashSuccess } from "@/lib/flash";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth-schema";

/**
 * Formulario de registro (spec.md, sección 15).
 *
 * Al crear la cuenta queda la sesión iniciada, de modo que nadie tenga que
 * escribir sus credenciales dos veces seguidas. La cuenta nace con rol
 * `USER`: el registro público no puede otorgar `ADMIN`.
 */
export function RegisterForm({ redirectTo }: { readonly redirectTo: string }) {
  const fieldId = useId();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setErrorMessage(null);

    try {
      await registerAccount(values);
      flashSuccess("Tu cuenta quedó creada y ya iniciaste sesión.");
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No pudimos crear tu cuenta.",
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
        id={`${fieldId}-password`}
        label="Contraseña"
        hint="Mínimo 8 caracteres"
        error={errors.password?.message}
      >
        <input
          id={`${fieldId}-password`}
          type="password"
          autoComplete="new-password"
          className={fieldInputClassName(Boolean(errors.password))}
          {...fieldErrorAttributes(
            `${fieldId}-password`,
            Boolean(errors.password),
          )}
          {...register("password")}
        />
      </FormField>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong disabled:cursor-progress disabled:opacity-70"
      >
        {isSubmitting ? "Creando la cuenta…" : "Crear cuenta"}
      </button>

      {/* El fallo de autenticación se anuncia: quien no ve la pantalla debe
          enterarse de que no entró. */}
      <p aria-live="polite" className="text-sm text-danger">
        {errorMessage}
      </p>
    </form>
  );
}
