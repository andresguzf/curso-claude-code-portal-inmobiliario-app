/**
 * Contrato de las consultas sobre una propiedad (spec.md, sección 14).
 *
 * El visitante escribe nombre, email, teléfono y mensaje. La propiedad no la
 * escribe: la identifica el formulario y el backend la resuelve desde la base
 * de datos, para que el título que viaja a Web3Forms sea el real y no uno
 * enviado desde el navegador.
 */

export type InquiryRequestDto = {
  /** Propiedad sobre la que se consulta. */
  readonly propertyId: string;
  readonly name: string;
  readonly email: string;
  /** Opcional: no todo el mundo quiere dejar un teléfono. */
  readonly phone?: string | undefined;
  readonly message: string;
};

/** Respuesta a una consulta aceptada. */
export type InquiryCreatedDto = {
  readonly message: string;
};

/**
 * Cotas de los campos.
 *
 * Viven en el contrato para que el formulario y el backend rechacen
 * exactamente lo mismo: si el navegador admitiera un mensaje que el servidor
 * descarta, el visitante escribiría en vano.
 */
export const INQUIRY_LIMITS = {
  maxNameLength: 120,
  maxEmailLength: 160,
  maxPhoneLength: 32,
  minMessageLength: 10,
  maxMessageLength: 1000,
} as const;
