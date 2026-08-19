import type { UserRoleValue } from "./domain";

/**
 * Contrato de autenticación (spec.md, sección 15).
 *
 * La contraseña solo viaja del navegador al servidor, nunca de vuelta: no
 * existe ningún DTO que la contenga en una respuesta. Del usuario autenticado
 * se devuelve lo justo para pintar la interfaz.
 */

export type RegisterRequestDto = {
  readonly name: string;
  readonly email: string;
  readonly password: string;
};

export type LoginRequestDto = {
  readonly email: string;
  readonly password: string;
};

/** Usuario autenticado, tal como lo ve el navegador. */
export type AuthenticatedUserDto = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRoleValue;
};

/**
 * Nombre de la cookie de sesión.
 *
 * Forma parte del contrato: la emite el backend y el frontend necesita
 * reconocerla para saber si merece la pena pedir la página protegida.
 */
export const SESSION_COOKIE_NAME = "portal_session";

/** Cotas de los campos, compartidas por el formulario y el backend. */
export const AUTH_LIMITS = {
  maxNameLength: 120,
  maxEmailLength: 160,
  /**
   * Ocho caracteres es el mínimo que recomienda el NIST. No se exigen
   * mayúsculas ni símbolos: esas reglas empujan a contraseñas predecibles y
   * el propio NIST desaconseja imponerlas.
   */
  minPasswordLength: 8,
  /**
   * El límite superior protege al servidor, no a la contraseña: derivar el
   * hash de un texto enorme es trabajo regalado a quien lo envía.
   */
  maxPasswordLength: 200,
} as const;
