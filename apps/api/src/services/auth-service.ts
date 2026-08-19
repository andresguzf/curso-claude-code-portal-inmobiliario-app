import "server-only";

import type { AuthenticatedUserDto } from "@portal/contracts";

import { hashPassword, verifyPassword } from "@/lib/password";
import { readSessionToken } from "@/lib/session";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
} from "@/repositories/user-repository";
import {
  validateAccountUpdate,
  validateLogin,
  validateRegister,
} from "@/services/auth-validation";

/**
 * Reglas de autenticación (spec.md, sección 15).
 *
 * Un usuario inactivo no puede entrar (plan.md, sección 10), y esa
 * comprobación se repite en cada petición: desactivar una cuenta debe surtir
 * efecto en el acto, no cuando caduque su sesión.
 */

/**
 * Hash de descarte para las contraseñas de correos que no existen.
 *
 * Sin él, un login con correo desconocido respondería antes que uno con
 * correo real, y ese hueco de tiempo permite averiguar qué cuentas existen.
 * Se deriva una vez y se reutiliza.
 */
let decoyHash: Promise<string> | null = null;

function readDecoyHash(): Promise<string> {
  decoyHash ??= hashPassword("contraseña que nadie usa");

  return decoyHash;
}

export type RegisterOutcome =
  | { readonly status: "created"; readonly user: AuthenticatedUserDto }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "email-taken" };

export type LoginOutcome =
  | { readonly status: "authenticated"; readonly user: AuthenticatedUserDto }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "rejected" };

export async function registerUser(payload: unknown): Promise<RegisterOutcome> {
  const validation = validateRegister(payload);

  if (!validation.ok) {
    return { status: "invalid", message: validation.message };
  }

  const { name, email, password } = validation.value;

  if (await findUserByEmail(email)) {
    return { status: "email-taken" };
  }

  const user = await createUser({
    name,
    email,
    passwordHash: await hashPassword(password),
  });

  return { status: "created", user: toAuthenticatedUser(user) };
}

/**
 * Comprueba unas credenciales.
 *
 * Credenciales incorrectas y cuenta desactivada devuelven lo mismo, y a
 * propósito: distinguirlas confirmaría que ese correo tiene cuenta.
 */
export async function loginUser(payload: unknown): Promise<LoginOutcome> {
  const validation = validateLogin(payload);

  if (!validation.ok) {
    return { status: "invalid", message: validation.message };
  }

  const { email, password } = validation.value;
  const user = await findUserByEmail(email);
  const passwordMatches = await verifyPassword(
    password,
    user?.passwordHash ?? (await readDecoyHash()),
  );

  if (!user || !passwordMatches || !user.isActive) {
    return { status: "rejected" };
  }

  return { status: "authenticated", user: toAuthenticatedUser(user) };
}

/**
 * Usuario dueño de una sesión, o `null` si no hay ninguna válida.
 *
 * El rol y el estado de la cuenta se releen de PostgreSQL, nunca del testigo.
 */
export async function getAuthenticatedUser(
  token: string | undefined,
): Promise<AuthenticatedUserDto | null> {
  const userId = await readSessionToken(token);

  if (userId === null) {
    return null;
  }

  const user = await findUserById(userId);

  return user && user.isActive ? toAuthenticatedUser(user) : null;
}

export type UpdateAccountOutcome =
  | { readonly status: "updated"; readonly user: AuthenticatedUserDto }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "wrong-password" }
  | { readonly status: "email-taken" }
  | { readonly status: "gone" };

/**
 * Actualiza la propia cuenta (spec.md, sección 17).
 *
 * Solo toca nombre, email y contraseña. El rol y el estado no llegan hasta
 * aquí —el contrato no los declara y el repositorio no los admite—, de modo
 * que nadie puede ascenderse a ADMIN enviando un campo de más.
 */
export async function updateAccount(
  userId: string,
  payload: unknown,
): Promise<UpdateAccountOutcome> {
  const validation = validateAccountUpdate(payload);

  if (!validation.ok) {
    return { status: "invalid", message: validation.message };
  }

  const { name, email, currentPassword, newPassword } = validation.value;
  const user = await findUserById(userId);

  if (!user || !user.isActive) {
    // La cuenta desapareció o fue desactivada con la sesión abierta.
    return { status: "gone" };
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { status: "wrong-password" };
  }

  const owner = await findUserByEmail(email);

  if (owner && owner.id !== user.id) {
    return { status: "email-taken" };
  }

  const updated = await updateUser(user.id, {
    name,
    email,
    ...(newPassword ? { passwordHash: await hashPassword(newPassword) } : {}),
  });

  return { status: "updated", user: toAuthenticatedUser(updated) };
}

/** El hash de la contraseña nunca sale de esta capa. */
function toAuthenticatedUser(user: {
  id: string;
  name: string;
  email: string;
  role: AuthenticatedUserDto["role"];
}): AuthenticatedUserDto {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
