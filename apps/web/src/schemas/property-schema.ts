import { z } from "zod";

import {
  OperationType,
  PROPERTY_LIMITS,
  PropertyType,
  type OperationTypeValue,
  type PropertyInputDto,
  type PropertyTypeValue,
} from "@portal/contracts";

/**
 * Validación del formulario de propiedad (spec.md, sección 19).
 *
 * Las cotas salen del contrato compartido, las mismas que aplica el backend:
 * esta comprobación solo evita un viaje de ida y vuelta, la que protege es
 * la del servidor.
 *
 * Los números se validan como texto porque eso es lo que entrega un campo de
 * formulario, y porque hay que distinguir «cero» de «vacío»: un terreno con
 * cero dormitorios y uno que no declara dormitorios no son lo mismo.
 */

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

function requiredText(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `Falta ${lowerFirst(label)}.`)
    .max(max, `${label} supera el largo máximo.`);
}

function numberText(options: {
  readonly label: string;
  readonly max: number;
  readonly isInteger: boolean;
  readonly isRequired: boolean;
}) {
  return z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (value === "") {
        if (options.isRequired) {
          context.addIssue({
            code: "custom",
            message: `Falta ${lowerFirst(options.label)}.`,
          });
        }

        return;
      }

      const parsed = Number(value);

      if (!Number.isFinite(parsed)) {
        context.addIssue({
          code: "custom",
          message: `${options.label} debe ser un número.`,
        });

        return;
      }

      if (options.isRequired ? parsed <= 0 : parsed < 0) {
        context.addIssue({
          code: "custom",
          message: options.isRequired
            ? `${options.label} debe ser mayor que cero.`
            : `${options.label} no puede ser menor que cero.`,
        });

        return;
      }

      if (options.isInteger && !Number.isInteger(parsed)) {
        context.addIssue({
          code: "custom",
          message: `${options.label} debe ser un número entero.`,
        });

        return;
      }

      if (parsed > options.max) {
        context.addIssue({
          code: "custom",
          message: `${options.label} supera el máximo permitido.`,
        });
      }
    });
}

const operationValues = Object.values(OperationType) as [
  OperationTypeValue,
  ...OperationTypeValue[],
];

const propertyTypeValues = Object.values(PropertyType) as [
  PropertyTypeValue,
  ...PropertyTypeValue[],
];

export const propertyFormSchema = z.object({
  title: requiredText("El título", PROPERTY_LIMITS.maxTitleLength),
  description: requiredText(
    "La descripción",
    PROPERTY_LIMITS.maxDescriptionLength,
  ),
  operationType: z.enum(operationValues, { error: "Elige la operación." }),
  propertyType: z.enum(propertyTypeValues, {
    error: "Elige el tipo de propiedad.",
  }),
  price: numberText({
    label: "El precio",
    max: PROPERTY_LIMITS.maxPrice,
    isInteger: false,
    isRequired: true,
  }),
  usableAreaSquareMeters: numberText({
    label: "La superficie útil",
    max: PROPERTY_LIMITS.maxArea,
    isInteger: false,
    isRequired: false,
  }),
  totalAreaSquareMeters: numberText({
    label: "La superficie total",
    max: PROPERTY_LIMITS.maxArea,
    isInteger: false,
    isRequired: false,
  }),
  bedrooms: numberText({
    label: "Los dormitorios",
    max: PROPERTY_LIMITS.maxRooms,
    isInteger: true,
    isRequired: false,
  }),
  bathrooms: numberText({
    label: "Los baños",
    max: PROPERTY_LIMITS.maxRooms,
    isInteger: true,
    isRequired: false,
  }),
  parkingSpaces: numberText({
    label: "Los estacionamientos",
    max: PROPERTY_LIMITS.maxRooms,
    isInteger: true,
    isRequired: false,
  }),
  ageYears: numberText({
    label: "La antigüedad",
    max: PROPERTY_LIMITS.maxAgeYears,
    isInteger: true,
    isRequired: false,
  }),
  address: requiredText("La dirección", PROPERTY_LIMITS.maxLocationLength),
  commune: requiredText("La comuna", PROPERTY_LIMITS.maxLocationLength),
  city: requiredText("La ciudad", PROPERTY_LIMITS.maxLocationLength),
  region: requiredText("La región", PROPERTY_LIMITS.maxLocationLength),
  featureSlugs: z.array(z.string()),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

/**
 * Traduce lo que se escribió a lo que espera la API.
 *
 * Un campo numérico vacío viaja como `null`, que significa «esta propiedad
 * no declara ese dato», no como cero ni como ausencia del campo.
 *
 * No se envían latitud ni longitud: las deduce el servidor a partir de la
 * dirección (spec.md, sección 19).
 */
export function toPropertyInput(values: PropertyFormValues): PropertyInputDto {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    operationType: values.operationType,
    propertyType: values.propertyType,
    price: Number(values.price),
    usableAreaSquareMeters: toOptionalNumber(values.usableAreaSquareMeters),
    totalAreaSquareMeters: toOptionalNumber(values.totalAreaSquareMeters),
    bedrooms: toOptionalNumber(values.bedrooms),
    bathrooms: toOptionalNumber(values.bathrooms),
    parkingSpaces: toOptionalNumber(values.parkingSpaces),
    ageYears: toOptionalNumber(values.ageYears),
    address: values.address.trim(),
    commune: values.commune.trim(),
    city: values.city.trim(),
    region: values.region.trim(),
    featureSlugs: values.featureSlugs,
    isPublished: values.isPublished,
    isFeatured: values.isFeatured,
  };
}

function toOptionalNumber(value: string): number | null {
  const trimmed = value.trim();

  return trimmed === "" ? null : Number(trimmed);
}
