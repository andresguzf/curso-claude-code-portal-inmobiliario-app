import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from "@/lib/security-headers";

function leer(clave: string, desarrollo = true) {
  return buildSecurityHeaders(desarrollo).find(
    (cabecera) => cabecera.key === clave,
  )?.value;
}

describe("buildContentSecurityPolicy", () => {
  it("parte de un origen propio y cierra lo que no se usa", () => {
    const politica = buildContentSecurityPolicy(false);

    expect(politica).toContain("default-src 'self'");
    expect(politica).toContain("object-src 'none'");
    // Sin `base-uri`, una etiqueta inyectada reescribe a dónde apuntan todas
    // las rutas relativas de la página.
    expect(politica).toContain("base-uri 'self'");
    expect(politica).toContain("form-action 'self'");
  });

  it("no concede unsafe-eval en producción", () => {
    // Lo exige la recarga en caliente del desarrollo, y nada más.
    expect(buildContentSecurityPolicy(false)).not.toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy(true)).toContain("'unsafe-eval'");
  });

  it("deja pasar lo que el portal necesita de fuera", () => {
    const politica = buildContentSecurityPolicy(false);

    // El mapa se dibuja en el navegador con el script de Google.
    expect(politica).toContain("https://maps.googleapis.com");
    // Las fotografías de las propiedades viven en Cloudinary.
    expect(politica).toContain("https://res.cloudinary.com");
    // El formulario de contacto envía desde el navegador.
    expect(politica).toContain("https://api.web3forms.com");
  });

  it("admite lo que el mapa carga después del script inicial", () => {
    const politica = buildContentSecurityPolicy(false);

    // Las teselas salen de subdominios rotatorios, y la tipografía Roboto de
    // Google Fonts: con solo `maps.googleapis.com` el mapa queda a medias.
    expect(politica).toContain("https://*.gstatic.com");
    expect(politica).toContain("https://fonts.googleapis.com");
    expect(politica).toContain("https://fonts.gstatic.com");
    // El mapa vectorial dibuja en un trabajador creado desde un `blob:`.
    expect(politica).toContain("worker-src 'self' blob:");
  });

  it("prohíbe que el portal se incruste en otro sitio", () => {
    // Un marco invisible sobre el panel convierte un clic de quien administra
    // en una acción que no quiso hacer.
    expect(buildContentSecurityPolicy(false)).toContain(
      "frame-ancestors 'none'",
    );
  });
});

describe("buildSecurityHeaders", () => {
  it("acompaña la política con las cabeceras clásicas", () => {
    expect(leer("X-Frame-Options")).toBe("DENY");
    expect(leer("X-Content-Type-Options")).toBe("nosniff");
  });

  it("no filtra la ruta al salir del sitio", () => {
    // Un enlace desde `/admin/users/{id}` no debe contarle a nadie qué se
    // estaba mirando: se anuncia el origen, nunca la ruta.
    expect(leer("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("deniega los permisos del navegador que el portal no usa", () => {
    const permisos = leer("Permissions-Policy") ?? "";

    for (const permiso of ["camera", "microphone", "geolocation", "payment"]) {
      expect(permisos).toContain(`${permiso}=()`);
    }
  });

  it("exige https solo en producción", () => {
    expect(leer("Strict-Transport-Security", true)).toBeUndefined();
    expect(leer("Strict-Transport-Security", false)).toContain(
      "max-age=31536000",
    );
  });
});
