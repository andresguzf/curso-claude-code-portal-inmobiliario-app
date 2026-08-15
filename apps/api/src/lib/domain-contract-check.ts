import type {
  CurrencyValue,
  OperationTypeValue,
  PropertyTypeValue,
  UserRoleValue,
} from "@portal/contracts";

import type {
  Currency,
  OperationType,
  PropertyType,
  UserRole,
} from "@/generated/prisma/enums";

/**
 * Verificación en tiempo de compilación de que el vocabulario publicado en
 * `@portal/contracts` coincide exactamente con las enumeraciones del esquema
 * de Prisma.
 *
 * El frontend no importa el cliente generado, así que sin esta comprobación
 * un valor añadido o renombrado en `schema.prisma` pasaría inadvertido hasta
 * llegar al navegador. Aquí rompe el build del backend.
 */

type AssertEqual<TLeft, TRight> = [TLeft] extends [TRight]
  ? [TRight] extends [TLeft]
    ? true
    : never
  : never;

// Si alguna de estas líneas deja de compilar, el esquema de Prisma y el
// contrato compartido divergieron.
export type OperationTypeMatches = AssertEqual<
  OperationType,
  OperationTypeValue
>;
export type PropertyTypeMatches = AssertEqual<PropertyType, PropertyTypeValue>;
export type CurrencyMatches = AssertEqual<Currency, CurrencyValue>;
export type UserRoleMatches = AssertEqual<UserRole, UserRoleValue>;
