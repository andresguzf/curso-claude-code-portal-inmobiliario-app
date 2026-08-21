import { FEATURE_LIMITS } from "@portal/contracts";

/**
 * Validación de una característica (spec.md, sección 4).
 *
 * Módulo puro: no importa Prisma ni `server-only`, para poder probar las
 * reglas sin base de datos.
 */

export type FeatureValidationResult =
  | { readonly ok: true; readonly name: string; readonly slug: string }
  | { readonly ok: false; readonly message: string };

/**
 * Identificador estable a partir del nombre.
 *
 * Se quitan los acentos antes de reemplazar: sin eso, «Lavandería» daría
 * `lavander-a`, con la í convertida en separador. Los seed existentes usan
 * exactamente esta forma —`aire-acondicionado`, `pet-friendly`—, así que la
 * función reproduce lo que ya hay y no inventa un formato nuevo.
 */
export function toFeatureSlug(name: string): string {
  return (
    name
      .normalize("NFD")
      // Rango de marcas combinantes, escrito por su código: los caracteres
      // literales serían invisibles al leer esta línea.
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

export function validateFeatureInput(
  payload: unknown,
): FeatureValidationResult {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, message: "El cuerpo de la solicitud es inválido." };
  }

  const raw = (payload as { name?: unknown }).name;
  const name = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";

  if (name === "") {
    return { ok: false, message: "Falta el nombre de la característica." };
  }

  if (name.length > FEATURE_LIMITS.maxNameLength) {
    return {
      ok: false,
      message: `El nombre supera los ${FEATURE_LIMITS.maxNameLength} caracteres.`,
    };
  }

  const slug = toFeatureSlug(name);

  // Un nombre de solo signos —«///»— daría un identificador vacío, y dos así
  // colisionarían entre sí. Mejor decirlo que guardar algo sin nombre útil.
  if (slug === "") {
    return {
      ok: false,
      message: "El nombre debe contener al menos una letra o un número.",
    };
  }

  return { ok: true, name, slug };
}
