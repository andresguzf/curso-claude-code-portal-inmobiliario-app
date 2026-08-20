import "server-only";

import { notFound, redirect } from "next/navigation";

import { UserRole, type AuthenticatedUserDto } from "@portal/contracts";

import { getCurrentUser } from "@/lib/current-user";

/**
 * Protección de páginas privadas (spec.md, sección 21).
 *
 * Quien decide es el backend: estas funciones preguntan por la sesión y
 * actúan según la respuesta. La interfaz no confía en nada que venga del
 * navegador, ni siquiera en la cookie que el `middleware` ya vio pasar.
 */

/**
 * Exige una sesión iniciada.
 *
 * Sin sesión lleva al login recordando el destino, para que tras entrar se
 * continúe donde se iba y no en la portada.
 */
export async function requireCurrentUser(
  currentPath: string,
): Promise<AuthenticatedUserDto> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  }

  return user;
}

/**
 * Exige rol ADMIN.
 *
 * A quien ha entrado pero no es administrador se le responde «no existe», no
 * «no puedes». Es el mismo criterio que usa la API con las propiedades en
 * borrador: si no puedes verlo, tampoco puedes averiguar que está ahí.
 */
export async function requireAdminUser(
  currentPath: string,
): Promise<AuthenticatedUserDto> {
  const user = await requireCurrentUser(currentPath);

  if (user.role !== UserRole.ADMIN) {
    notFound();
  }

  return user;
}

/**
 * Exige una sesión que no sea de administración.
 *
 * ADMIN no tiene área de cuenta: no acumula favoritos ni consultas, y sus
 * datos los edita en el panel (spec.md, sección 3). Se le lleva allí en
 * lugar de responderle «no existe», porque la página sí existe y él sabe que
 * existe: simplemente no es la suya.
 */
export async function requireStandardUser(
  currentPath: string,
): Promise<AuthenticatedUserDto> {
  const user = await requireCurrentUser(currentPath);

  if (user.role === UserRole.ADMIN) {
    redirect("/admin");
  }

  return user;
}
