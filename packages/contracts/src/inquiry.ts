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

/** Respuesta a una consulta registrada. */
export type InquiryCreatedDto = {
  readonly id: string;
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

/**
 * Una solicitud del historial propio (spec.md, sección 17).
 *
 * Lleva el mensaje enviado, no solo la propiedad: quien vuelve a su historial
 * busca qué preguntó, y sin el texto todas las entradas se parecen.
 */
export type UserInquiryDto = {
  readonly id: string;
  readonly message: string;
  readonly createdAt: string;
  readonly property: {
    readonly id: string;
    readonly title: string;
    readonly imageUrl: string | null;
  };
};

/** Página del historial de solicitudes. */
export type UserInquiryPageDto = {
  readonly data: readonly UserInquiryDto[];
  /** Total de solicitudes que cumplen la búsqueda, no las de esta página. */
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
};

/** Solicitudes por página en el historial (spec.md, sección 17). */
export const INQUIRIES_PER_PAGE = 6;

/**
 * Una consulta vista desde la administración (spec.md, sección 22).
 *
 * A diferencia del historial propio, aquí figuran **todas**: también las que
 * quien las escribió quitó de su historial, y las de propiedades
 * despublicadas o eliminadas. Ese es el motivo por el que aquel borrado es
 * lógico: la consulta es un contacto comercial que la inmobiliaria tiene que
 * poder responder.
 */
export type AdminInquiryDto = {
  readonly id: string;
  /** Quien escribió, tal como lo puso en el formulario. */
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly message: string;
  readonly createdAt: string;
  readonly property: {
    readonly id: string;
    readonly title: string;
    readonly isPublished: boolean;
    /** Una propiedad eliminada ya no tiene ficha que abrir. */
    readonly isDeleted: boolean;
  };
  /** Nulo cuando la envió un visitante sin cuenta. */
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  } | null;
  /** Quien la escribió la quitó de su historial. Aquí sigue estando. */
  readonly isHiddenByUser: boolean;
};

export type AdminInquiryPageDto = {
  readonly data: readonly AdminInquiryDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
};

/** Filtros del listado de consultas. Viven en la URL, como en el catálogo. */
export type AdminInquiryListQuery = {
  readonly search?: string | undefined;
  readonly page?: number | undefined;
};

export const ADMIN_INQUIRY_QUERY_PARAM_NAMES = {
  search: "search",
  page: "page",
} as const satisfies Record<keyof AdminInquiryListQuery, string>;

export const ADMIN_INQUIRIES_PER_PAGE = 10;
