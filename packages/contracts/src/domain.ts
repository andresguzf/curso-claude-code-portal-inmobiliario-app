/**
 * Vocabulario del dominio (spec.md, sección 3).
 *
 * Se declara aquí, y no se reexporta desde el cliente generado por Prisma,
 * para que el frontend no arrastre el ORM. El backend verifica en tiempo de
 * compilación que estos valores coincidan con el esquema de Prisma.
 */

export const OperationType = {
  SALE: "SALE",
  RENT: "RENT",
} as const;

export type OperationTypeValue =
  (typeof OperationType)[keyof typeof OperationType];

export const PropertyType = {
  HOUSE: "HOUSE",
  APARTMENT: "APARTMENT",
  LAND: "LAND",
  OFFICE: "OFFICE",
  COMMERCIAL: "COMMERCIAL",
  OTHER: "OTHER",
} as const;

export type PropertyTypeValue =
  (typeof PropertyType)[keyof typeof PropertyType];

export const Currency = {
  USD: "USD",
} as const;

export type CurrencyValue = (typeof Currency)[keyof typeof Currency];

export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];
