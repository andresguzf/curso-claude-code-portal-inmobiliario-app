import Link from "next/link";

import { AccountForm } from "@/components/auth/account-form";
import { requireCurrentUser } from "@/lib/require-user";

/** Los datos que se editan son los de la sesión vigente. */
export const dynamic = "force-dynamic";

/** El layout añade el sufijo del sitio mediante su plantilla de título. */
export const metadata = {
  title: "Editar cuenta",
};

const EDIT_ACCOUNT_PATH = "/account/edit";

/**
 * Edición de la propia cuenta (spec.md, sección 17).
 *
 * El formulario llega relleno con los datos actuales, para que editar sea
 * corregir y no volver a escribirlo todo.
 */
export default async function EditAccountPage() {
  const user = await requireCurrentUser(EDIT_ACCOUNT_PATH);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Miga de pan" className="text-sm">
        <Link
          href="/account"
          className="rounded-sm text-ink-muted underline underline-offset-4 transition-colors hover:text-accent"
        >
          ← Volver a mi cuenta
        </Link>
      </nav>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Editar cuenta
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Tu perfil y el estado de tu cuenta los gestiona la administración del
        portal.
      </p>

      <div className="mt-8 rounded-xl border border-line bg-card p-6">
        <AccountForm name={user.name} email={user.email} />
      </div>
    </div>
  );
}
