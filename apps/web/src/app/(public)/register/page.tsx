import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/current-user";
import { sanitizeRedirectPath } from "@/lib/redirect";

/** La sesión se comprueba en cada visita. */
export const dynamic = "force-dynamic";

/** El layout añade el sufijo del sitio mediante su plantilla de título. */
export const metadata = {
  title: "Crear cuenta",
};

/**
 * Página de registro (spec.md, sección 15).
 *
 * Quien ya tiene sesión no ve el formulario: se le lleva a donde iba.
 */
export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  const { next } = await searchParams;
  const redirectTo = sanitizeRedirectPath(Array.isArray(next) ? next[0] : next);

  if (await getCurrentUser()) {
    redirect(redirectTo);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Crear cuenta</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Con una cuenta puedes guardar propiedades favoritas y revisar tus
        consultas.
      </p>

      <div className="mt-8 rounded-xl border border-line bg-card p-6">
        <RegisterForm redirectTo={redirectTo} />
      </div>

      <p className="mt-6 text-sm text-ink-muted">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
        >
          Ingresar
        </Link>
      </p>
    </div>
  );
}
