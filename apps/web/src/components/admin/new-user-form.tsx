"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";

import { AUTH_LIMITS, UserRole } from "@portal/contracts";

import { fieldInputClassName } from "@/components/form/form-field";
import { createAdminUser } from "@/lib/api-client";
import { formatUserRole } from "@/lib/format";

/**
 * Alta de una cuenta desde la administración (spec.md, sección 21).
 *
 * Va plegada: dar de alta es lo excepcional en esta pantalla —lo habitual es
 * buscar a alguien— y un formulario de cuatro campos siempre abierto
 * empujaría el listado fuera de la vista.
 *
 * Admite crear otra administración. Es la única vía para hacerlo dentro de la
 * aplicación: el registro público solo crea cuentas `USER`.
 */
export function NewUserForm() {
  const fieldId = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const role = String(form.get("role") ?? UserRole.USER);

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        await createAdminUser({
          name,
          email,
          password,
          role: role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER,
        });

        // El formulario se vacía para poder dar de alta varias seguidas, y
        // sigue abierto por el mismo motivo.
        formRef.current?.reset();
        nameRef.current?.focus();
        setSuccessMessage(
          `Cuenta creada para ${name}. Comunícale su contraseña: no hay forma de recuperarla desde aquí.`,
        );
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No pudimos crear la cuenta.",
        );
      }
    });
  }

  return (
    <section className="rounded-xl border border-line bg-card">
      <h2>
        <button
          type="button"
          onClick={() => {
            setIsOpen((open) => !open);
            setSuccessMessage(null);
          }}
          aria-expanded={isOpen}
          aria-controls={`${fieldId}-panel`}
          className="flex min-h-11 w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-ink"
        >
          Nueva cuenta
          <span className="ml-auto text-ink-muted" aria-hidden="true">
            {isOpen ? "−" : "+"}
          </span>
        </button>
      </h2>

      <form
        ref={formRef}
        id={`${fieldId}-panel`}
        hidden={!isOpen}
        onSubmit={submit}
        className="flex flex-col gap-4 border-t border-line px-4 py-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${fieldId}-name`} label="Nombre">
            <input
              ref={nameRef}
              id={`${fieldId}-name`}
              name="name"
              type="text"
              required
              autoComplete="off"
              maxLength={AUTH_LIMITS.maxNameLength}
              className={fieldInputClassName(false)}
            />
          </Field>

          <Field id={`${fieldId}-email`} label="Email">
            <input
              id={`${fieldId}-email`}
              name="email"
              type="email"
              required
              inputMode="email"
              autoComplete="off"
              spellCheck={false}
              maxLength={AUTH_LIMITS.maxEmailLength}
              className={fieldInputClassName(false)}
            />
          </Field>

          <Field
            id={`${fieldId}-password`}
            label="Contraseña inicial"
            hint={`Mínimo ${AUTH_LIMITS.minPasswordLength} caracteres`}
          >
            <input
              id={`${fieldId}-password`}
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={AUTH_LIMITS.minPasswordLength}
              maxLength={AUTH_LIMITS.maxPasswordLength}
              className={fieldInputClassName(false)}
            />
          </Field>

          <Field id={`${fieldId}-role`} label="Rol">
            <select
              id={`${fieldId}-role`}
              name="role"
              defaultValue={UserRole.USER}
              className={fieldInputClassName(false)}
            >
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {formatUserRole(role)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <p className="text-xs text-ink-muted">
          La cuenta nace activa. Quien la reciba podrá cambiar su contraseña
          desde su propia área; tú no podrás verla, solo reemplazarla.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong disabled:cursor-progress disabled:opacity-70"
          >
            {isPending ? "Creando…" : "Crear cuenta"}
          </button>

          <p aria-live="polite" className="text-sm text-ink-muted">
            {successMessage}
          </p>
        </div>

        <p aria-live="polite" className="text-sm text-danger">
          {errorMessage}
        </p>
      </form>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {hint ? (
          <span className="ml-2 font-normal text-ink-muted">{hint}</span>
        ) : null}
      </label>
      {children}
    </div>
  );
}
