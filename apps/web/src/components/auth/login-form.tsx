"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

import { UserRole, type UserRoleValue } from "@portal/contracts";

import {
  fieldErrorAttributes,
  fieldInputClassName,
  FormField,
} from "@/components/form/form-field";
import { logIn } from "@/lib/api-client";
import { DEFAULT_REDIRECT_PATH } from "@/lib/redirect";
import { loginSchema, type LoginFormValues } from "@/schemas/auth-schema";

/**
 * Formulario de inicio de sesión (spec.md, sección 15).
 *
 * No guarda nada: la sesión llega en una cookie `httpOnly` que pone el
 * servidor. Tras entrar se refresca la ruta para que el header, que se pinta
 * en el servidor, muestre ya al usuario.
 */
export function LoginForm({ redirectTo }: { readonly redirectTo: string }) {
  const fieldId = useId();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setErrorMessage(null);

    try {
      const user = await logIn(values);

      router.replace(resolveDestination(user.role, redirectTo));
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No pudimos iniciar sesión.",
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
        error={errors.password?.message}
      >
        <input
          id={`${fieldId}-password`}
          type="password"
          autoComplete="current-password"
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
        {isSubmitting ? "Entrando…" : "Entrar"}
      </button>

      {/* El fallo de autenticación se anuncia: quien no ve la pantalla debe
          enterarse de que no entró. */}
      <p aria-live="polite" className="text-sm text-danger">
        {errorMessage}
      </p>
    </form>
  );
}

/**
 * A dónde llevar tras entrar.
 *
 * ADMIN va al panel: administra, no navega el catálogo. Pero si venía de una
 * página concreta —porque una guarda lo mandó al login— se respeta ese
 * destino, que es más específico que cualquier suposición sobre su rol.
 */
function resolveDestination(role: UserRoleValue, redirectTo: string): string {
  if (role === UserRole.ADMIN && redirectTo === DEFAULT_REDIRECT_PATH) {
    return "/admin";
  }

  return redirectTo;
}
