import {
  isOperationType,
  isPropertyType,
  PROPERTY_LIMITS,
  type PropertyInputDto,
} from "@portal/contracts";

/**
 * Validación de una propiedad enviada por ADMIN (spec.md, sección 19).
 *
 * Las cotas coinciden con las columnas de PostgreSQL: rechazar aquí lo que la
 * base rechazaría convierte un error de escritura en un mensaje claro en vez
 * de en un 500.
 *
 * Los campos opcionales admiten `null` de forma explícita: un terreno no
 * tiene dormitorios, y eso es un dato, no un olvido.
 */

export type PropertyValidationResult =
  | { readonly ok: true; readonly property: PropertyInputDto }
  | { readonly ok: false; readonly message: string };

type OptionalNumberField = {
  readonly name: keyof PropertyInputDto;
  readonly label: string;
  readonly max: number;
  readonly isInteger: boolean;
};

const OPTIONAL_NUMBERS: readonly OptionalNumberField[] = [
  {
    name: "usableAreaSquareMeters",
    label: "La superficie útil",
    max: PROPERTY_LIMITS.maxArea,
    isInteger: false,
  },
  {
    name: "totalAreaSquareMeters",
    label: "La superficie total",
    max: PROPERTY_LIMITS.maxArea,
    isInteger: false,
  },
  {
    name: "bedrooms",
    label: "Los dormitorios",
    max: PROPERTY_LIMITS.maxRooms,
    isInteger: true,
  },
  {
    name: "bathrooms",
    label: "Los baños",
    max: PROPERTY_LIMITS.maxRooms,
    isInteger: true,
  },
  {
    name: "parkingSpaces",
    label: "Los estacionamientos",
    max: PROPERTY_LIMITS.maxRooms,
    isInteger: true,
  },
  {
    name: "ageYears",
    label: "La antigüedad",
    max: PROPERTY_LIMITS.maxAgeYears,
    isInteger: true,
  },
];

const TEXT_FIELDS = [
  { name: "title", label: "El título", max: PROPERTY_LIMITS.maxTitleLength },
  {
    name: "description",
    label: "La descripción",
    max: PROPERTY_LIMITS.maxDescriptionLength,
  },
  {
    name: "address",
    label: "La dirección",
    max: PROPERTY_LIMITS.maxLocationLength,
  },
  {
    name: "commune",
    label: "La comuna",
    max: PROPERTY_LIMITS.maxLocationLength,
  },
  { name: "city", label: "La ciudad", max: PROPERTY_LIMITS.maxLocationLength },
  {
    name: "region",
    label: "La región",
    max: PROPERTY_LIMITS.maxLocationLength,
  },
] as const;

export function validatePropertyInput(
  payload: unknown,
): PropertyValidationResult {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, message: "El cuerpo de la solicitud es inválido." };
  }

  const fields = payload as Record<string, unknown>;
  const texts: Record<string, string> = {};

  for (const field of TEXT_FIELDS) {
    const value = readText(fields[field.name]);

    if (value === "") {
      return { ok: false, message: `Falta ${lowerFirst(field.label)}.` };
    }

    if (value.length > field.max) {
      return {
        ok: false,
        message: `${field.label} supera el largo máximo.`,
      };
    }

    texts[field.name] = value;
  }

  if (!isOperationType(fields.operationType)) {
    return { ok: false, message: "La operación no es válida." };
  }

  if (!isPropertyType(fields.propertyType)) {
    return { ok: false, message: "El tipo de propiedad no es válido." };
  }

  const price = readNumber(fields.price);

  if (price === null || price <= 0) {
    return { ok: false, message: "El precio debe ser mayor que cero." };
  }

  if (price > PROPERTY_LIMITS.maxPrice) {
    return { ok: false, message: "El precio es demasiado alto." };
  }

  const optionals: Record<string, number | null> = {};

  for (const field of OPTIONAL_NUMBERS) {
    const raw = fields[field.name];

    // Ausente o nulo significa «esta propiedad no tiene ese dato».
    if (raw === undefined || raw === null || raw === "") {
      optionals[field.name] = null;

      continue;
    }

    const value = readNumber(raw);

    if (value === null || value < 0) {
      return { ok: false, message: `${field.label} no es un número válido.` };
    }

    if (field.isInteger && !Number.isInteger(value)) {
      return {
        ok: false,
        message: `${field.label} debe ser un número entero.`,
      };
    }

    if (value > field.max) {
      return { ok: false, message: `${field.label} supera el máximo.` };
    }

    optionals[field.name] = value;
  }

  const featureSlugs = readFeatureSlugs(fields.featureSlugs);

  if (featureSlugs === null) {
    return { ok: false, message: "Las características no son válidas." };
  }

  return {
    ok: true,
    property: {
      title: texts.title as string,
      description: texts.description as string,
      operationType: fields.operationType,
      propertyType: fields.propertyType,
      price,
      usableAreaSquareMeters: optionals.usableAreaSquareMeters ?? null,
      totalAreaSquareMeters: optionals.totalAreaSquareMeters ?? null,
      bedrooms: optionals.bedrooms ?? null,
      bathrooms: optionals.bathrooms ?? null,
      parkingSpaces: optionals.parkingSpaces ?? null,
      ageYears: optionals.ageYears ?? null,
      address: texts.address as string,
      commune: texts.commune as string,
      city: texts.city as string,
      region: texts.region as string,
      featureSlugs,
      isPublished: fields.isPublished === true,
      isFeatured: fields.isFeatured === true,
    },
  };
}

/**
 * Minúscula inicial, para encajar la etiqueta dentro de una frase.
 *
 * Las etiquetas llevan artículo —«La comuna»— porque encabezan la mayoría de
 * los mensajes. En «Falta la comuna» va en medio, y ahí la mayúscula sobra.
 * Es también lo que evita un «La comuna es obligatorio»: la frase se
 * construye alrededor del artículo, no de la concordancia.
 */
function lowerFirst(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1);
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Acepta el número tal cual o el texto que llega de un formulario. */
function readNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

/** Devuelve `null` si el valor no es una lista de textos. */
function readFeatureSlugs(value: unknown): string[] | null {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const slugs = value.map((slug) => readText(slug)).filter(Boolean);

  // Repetir una característica no es un error, pero conectarla dos veces sí
  // lo sería para Prisma.
  return [...new Set(slugs)];
}
