import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/current-user";
import { sanitizeRedirectPath } from "@/lib/redirect";

/** La sesión se comprueba en cada visita. */
export const dynamic = "force-dynamic";

/** El layout añade el sufijo del sitio mediante su plantilla de título. */
export const metadata = {
  title: "Ingresar",
};

/**
 * Página de inicio de sesión (spec.md, sección 15).
 *
 * Quien ya tiene sesión no ve el formulario: se le lleva a donde iba.
 */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const redirectTo = sanitizeRedirectPath(Array.isArray(next) ? next[0] : next);

  if (await getCurrentUser()) {
    redirect(redirectTo);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Ingresar</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Entra para guardar propiedades favoritas y revisar tus consultas.
      </p>

      <div className="mt-8 rounded-xl border border-line bg-card p-6">
        <LoginForm redirectTo={redirectTo} />
      </div>

      <p className="mt-6 text-sm text-ink-muted">
        ¿Todavía no tienes cuenta?{" "}
        <Link
          href="/register"
          className="rounded-sm font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
        >
          Crear una cuenta
        </Link>
      </p>
    </div>
  );
}
