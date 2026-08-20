import { AccountForm } from "@/components/auth/account-form";
import { requireAdminUser } from "@/lib/require-user";

/** Los datos que se editan son los de la sesión vigente. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mi perfil",
};

const PROFILE_PATH = "/admin/profile";

/**
 * Datos de quien administra (spec.md, sección 21).
 *
 * ADMIN no tiene área de cuenta —no tiene favoritos ni consultas—, así que
 * sus credenciales se editan aquí, dentro del panel.
 *
 * El rol y el estado de la cuenta no aparecen, y no por omisión: nadie puede
 * cambiárselos a sí mismo. Una administración que se quita el rol dejaría el
 * portal sin quien lo administre, y el registro público solo crea `USER`.
 */
export default async function AdminProfilePage() {
  const admin = await requireAdminUser(PROFILE_PATH);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Cambia tu nombre, tu email o tu contraseña. Tu rol no se edita desde
        aquí.
      </p>

      <div className="mt-6 rounded-xl border border-line bg-card p-6">
        <AccountForm
          name={admin.name}
          email={admin.email}
          redirectTo={PROFILE_PATH}
        />
      </div>
    </div>
  );
}
