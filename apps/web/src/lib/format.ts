import {
  buildFullAddress,
  type CurrencyValue,
  type OperationTypeValue,
  type PropertyLocation,
} from "@portal/contracts";

/**
 * Formato de valores para la interfaz, en convención chilena: punto como
 * separador de miles (spec.md, sección 1 — mercado inicial de Chile).
 */

const LOCALE = "es-CL";

/**
 * Precio de una propiedad.
 *
 * En arriendo el precio es mensual, y así debe leerse en la interfaz
 * (spec.md, sección 3). Se omiten los decimales porque no aportan
 * información a un listado inmobiliario.
 */
export function formatPropertyPrice(
  price: number,
  currency: CurrencyValue,
  operationType: OperationTypeValue,
): string {
  const formattedPrice = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);

  return operationType === "RENT" ? `${formattedPrice}/mes` : formattedPrice;
}

/**
 * Superficie en metros cuadrados, o `null` si la propiedad no la declara.
 *
 * El espacio antes de la unidad es indivisible: «180 m²» no debe partirse
 * entre dos líneas dejando «m²» huérfano.
 */
export function formatArea(squareMeters: number | null): string | null {
  if (squareMeters === null) {
    return null;
  }

  return `${new Intl.NumberFormat(LOCALE).format(squareMeters)} m²`;
}

/** Ubicación resumida para las tarjetas del catálogo. */
export function formatShortLocation(commune: string, city: string): string {
  return commune === city ? commune : `${commune}, ${city}`;
}

/**
 * Ubicación completa para el detalle (spec.md, sección 12).
 *
 * Delega en el contrato compartido para que el texto que se muestra y el que
 * se le entrega a Google Maps describan exactamente el mismo lugar.
 */
export function formatFullLocation(location: PropertyLocation): string {
  return buildFullAddress(location);
}

/**
 * Antigüedad de la propiedad.
 *
 * Cero años significa que está por estrenar, no «0 años».
 */
export function formatAge(ageYears: number | null): string | null {
  if (ageYears === null) {
    return null;
  }

  if (ageYears === 0) {
    return "Nueva";
  }

  return ageYears === 1 ? "1 año" : `${ageYears} años`;
}

const OPERATION_LABELS: Record<OperationTypeValue, string> = {
  SALE: "Venta",
  RENT: "Arriendo",
};

export function formatOperationType(operationType: OperationTypeValue): string {
  return OPERATION_LABELS[operationType];
}

const PROPERTY_TYPE_LABELS = {
  HOUSE: "Casa",
  APARTMENT: "Departamento",
  LAND: "Terreno",
  OFFICE: "Oficina",
  COMMERCIAL: "Local comercial",
  OTHER: "Otro",
} as const;

export function formatPropertyType(
  propertyType: keyof typeof PROPERTY_TYPE_LABELS,
): string {
  return PROPERTY_TYPE_LABELS[propertyType];
}
