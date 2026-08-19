import {
  AUTH_LIMITS,
  type LoginRequestDto,
  type RegisterRequestDto,
} from "@portal/contracts";

/**
 * Validación de los datos de autenticación (spec.md, sección 15).
 *
 * Se escribe a mano, como el resto de validaciones del backend, y es la que
 * manda: la API es pública y nadie está obligado a pasar por el formulario.
 */

export type ValidationResult<TValue> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly message: string };

/**
 * Correo aceptable.
 *
 * Deliberadamente laxa: la única comprobación concluyente de un correo es
 * enviarle un mensaje. Una expresión estricta rechaza direcciones válidas.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(
  payload: unknown,
): ValidationResult<RegisterRequestDto> {
  const fields = readFields(payload);

  if (fields === null) {
    return { ok: false, message: "El cuerpo de la solicitud es inválido." };
  }

  const name = readText(fields.name);

  if (name === "") {
    return { ok: false, message: "El nombre es obligatorio." };
  }

  if (name.length > AUTH_LIMITS.maxNameLength) {
    return { ok: false, message: "El nombre es demasiado largo." };
  }

  const email = validateEmail(fields.email);

  if (!email.ok) {
    return email;
  }

  const password = validatePassword(fields.password);

  if (!password.ok) {
    return password;
  }

  return {
    ok: true,
    value: { name, email: email.value, password: password.value },
  };
}

export function validateLogin(
  payload: unknown,
): ValidationResult<LoginRequestDto> {
  const fields = readFields(payload);

  if (fields === null) {
    return { ok: false, message: "El cuerpo de la solicitud es inválido." };
  }

  const email = readText(fields.email);
  const password = typeof fields.password === "string" ? fields.password : "";

  // En el login no se detalla qué falta ni se comprueba el formato: cualquier
  // pista sobre la validez de un correo ayuda a enumerar cuentas.
  if (email === "" || password === "") {
    return { ok: false, message: "Email y contraseña son obligatorios." };
  }

  return { ok: true, value: { email, password } };
}

function validateEmail(value: unknown): ValidationResult<string> {
  const email = readText(value);

  if (email === "") {
    return { ok: false, message: "El email es obligatorio." };
  }

  if (email.length > AUTH_LIMITS.maxEmailLength || !EMAIL_PATTERN.test(email)) {
    return { ok: false, message: "El email no es válido." };
  }

  return { ok: true, value: email };
}

function validatePassword(value: unknown): ValidationResult<string> {
  // La contraseña no se recorta: los espacios son caracteres como cualquiera
  // y recortarlos cambiaría en silencio lo que la persona escribió.
  const password = typeof value === "string" ? value : "";

  if (password.length < AUTH_LIMITS.minPasswordLength) {
    return {
      ok: false,
      message: `La contraseña debe tener al menos ${AUTH_LIMITS.minPasswordLength} caracteres.`,
    };
  }

  if (password.length > AUTH_LIMITS.maxPasswordLength) {
    return { ok: false, message: "La contraseña es demasiado larga." };
  }

  return { ok: true, value: password };
}

function readFields(payload: unknown): Record<string, unknown> | null {
  return typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : null;
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
