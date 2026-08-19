import { z } from "zod";

import { AUTH_LIMITS } from "@portal/contracts";

/**
 * Validación de los formularios de sesión (spec.md, sección 15).
 *
 * Las cotas salen del contrato compartido, para que el navegador y el
 * backend rechacen lo mismo. La comprobación que protege es la del servidor:
 * esta solo evita un viaje de ida y vuelta inútil.
 */

const emailField = z
  .email("Revisa tu email: parece incompleto.")
  .max(AUTH_LIMITS.maxEmailLength, "El email es demasiado largo.");

export const loginSchema = z.object({
  email: emailField,
  // En el login no se exige largo mínimo: quien se registró con otras reglas
  // debe poder entrar, y rechazar aquí no aporta seguridad alguna.
  password: z.string().min(1, "Escribe tu contraseña."),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Escribe tu nombre.")
    .max(AUTH_LIMITS.maxNameLength, "El nombre es demasiado largo."),
  email: emailField,
  password: z
    .string()
    .min(
      AUTH_LIMITS.minPasswordLength,
      `La contraseña debe tener al menos ${AUTH_LIMITS.minPasswordLength} caracteres.`,
    )
    .max(AUTH_LIMITS.maxPasswordLength, "La contraseña es demasiado larga."),
});

/**
 * Cambios sobre la propia cuenta.
 *
 * `newPassword` vacío significa «no cambiarla». El campo siempre está en el
 * formulario, así que la cadena vacía es su estado normal, no un error.
 */
export const accountUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Escribe tu nombre.")
    .max(AUTH_LIMITS.maxNameLength, "El nombre es demasiado largo."),
  email: emailField,
  currentPassword: z
    .string()
    .min(1, "Escribe tu contraseña actual para guardar los cambios."),
  newPassword: z
    .string()
    .max(AUTH_LIMITS.maxPasswordLength, "La contraseña es demasiado larga.")
    .refine(
      (value) => value === "" || value.length >= AUTH_LIMITS.minPasswordLength,
      `La contraseña debe tener al menos ${AUTH_LIMITS.minPasswordLength} caracteres.`,
    ),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type AccountUpdateFormValues = z.infer<typeof accountUpdateSchema>;
