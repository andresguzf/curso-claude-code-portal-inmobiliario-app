import {
  AUTH_LIMITS,
  UserRole,
  type AdminCreateUserRequestDto,
  type AdminUpdateUserRequestDto,
  type UserRoleValue,
} from "@portal/contracts";

import {
  readFields,
  readText,
  validateEmail,
  validatePassword,
} from "@/services/auth-validation";

/**
 * Validación de los cambios que ADMIN hace sobre una cuenta ajena
 * (spec.md, sección 21).
 *
 * Es un `PATCH`: lo que no viaja no se toca. Un campo ausente y un campo
 * vacío son cosas distintas, y solo el primero significa «déjalo como está».
 *
 * Las reglas sobre la propia cuenta no viven aquí: dependen de quién hace la
 * petición, y eso lo sabe el servicio.
 */

export type AdminUserCreationResult =
  | { readonly ok: true; readonly user: Required<AdminCreateUserRequestDto> }
  | { readonly ok: false; readonly message: string };

export type AdminUserValidationResult =
  | { readonly ok: true; readonly changes: AdminUpdateUserRequestDto }
  | { readonly ok: false; readonly message: string };

function isUserRole(value: unknown): value is UserRoleValue {
  return (
    typeof value === "string" && Object.values<string>(UserRole).includes(value)
  );
}

export function validateAdminUserUpdate(
  payload: unknown,
): AdminUserValidationResult {
  const fields = readFields(payload);

  if (fields === null) {
    return { ok: false, message: "El cuerpo de la solicitud es inválido." };
  }

  const changes: {
    -readonly [
      Key in keyof AdminUpdateUserRequestDto
    ]: AdminUpdateUserRequestDto[Key];
  } = {};

  if (fields.name !== undefined) {
    const name = readText(fields.name);

    if (name === "") {
      return { ok: false, message: "El nombre es obligatorio." };
    }

    if (name.length > AUTH_LIMITS.maxNameLength) {
      return { ok: false, message: "El nombre es demasiado largo." };
    }

    changes.name = name;
  }

  if (fields.email !== undefined) {
    const email = validateEmail(fields.email);

    if (!email.ok) {
      return { ok: false, message: email.message };
    }

    changes.email = email.value;
  }

  // Ausente o vacío significa «no cambiarla», no «ponerla en blanco».
  if (typeof fields.newPassword === "string" && fields.newPassword !== "") {
    const password = validatePassword(fields.newPassword);

    if (!password.ok) {
      return { ok: false, message: password.message };
    }

    changes.newPassword = password.value;
  }

  if (fields.role !== undefined) {
    if (!isUserRole(fields.role)) {
      return { ok: false, message: "El rol no es válido." };
    }

    changes.role = fields.role;
  }

  if (fields.isActive !== undefined) {
    if (typeof fields.isActive !== "boolean") {
      return {
        ok: false,
        message: "El estado de la cuenta debe ser verdadero o falso.",
      };
    }

    changes.isActive = fields.isActive;
  }

  if (Object.keys(changes).length === 0) {
    return { ok: false, message: "No hay ningún cambio que aplicar." };
  }

  return { ok: true, changes };
}

/**
 * Validación del alta de una cuenta desde la administración.
 *
 * A diferencia del cambio, aquí los tres primeros campos son obligatorios:
 * una cuenta sin nombre, sin email o sin contraseña no se puede crear.
 *
 * El rol y el estado tienen valor por omisión, y se devuelven resueltos para
 * que el servicio no tenga que volver a decidirlos.
 */
export function validateAdminUserCreation(
  payload: unknown,
): AdminUserCreationResult {
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
    return { ok: false, message: email.message };
  }

  const password = validatePassword(fields.password);

  if (!password.ok) {
    return { ok: false, message: password.message };
  }

  if (fields.role !== undefined && !isUserRole(fields.role)) {
    return { ok: false, message: "El rol no es válido." };
  }

  if (fields.isActive !== undefined && typeof fields.isActive !== "boolean") {
    return {
      ok: false,
      message: "El estado de la cuenta debe ser verdadero o falso.",
    };
  }

  return {
    ok: true,
    user: {
      name,
      email: email.value,
      password: password.value,
      role: (fields.role as UserRoleValue | undefined) ?? UserRole.USER,
      // Una cuenta que nace sin poder entrar no le sirve a nadie.
      isActive: fields.isActive === undefined ? true : fields.isActive,
    },
  };
}
