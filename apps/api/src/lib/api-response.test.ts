import { describe, expect, it } from "vitest";

import {
  HTTP_STATUS,
  jsonError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/api-response";

describe("respuestas de la API", () => {
  it("marca no-store en las respuestas correctas", () => {
    // Casi todas dependen de quién pregunta; una caché intermedia podría
    // servir la de una persona a otra si nada se lo prohíbe.
    expect(jsonOk({ id: "1" }).headers.get("cache-control")).toBe("no-store");
  });

  it("marca no-store también en los errores", () => {
    const respuesta = jsonError("No encontrado.", HTTP_STATUS.NOT_FOUND);

    expect(respuesta.headers.get("cache-control")).toBe("no-store");
  });

  it("responde 429 diciendo cuánto hay que esperar", () => {
    const respuesta = jsonTooManyRequests(120);

    expect(respuesta.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    // Sin `Retry-After`, un cliente automático solo puede reintentar a ciegas.
    expect(respuesta.headers.get("retry-after")).toBe("120");
    expect(respuesta.headers.get("cache-control")).toBe("no-store");
  });

  it("cuenta la espera en minutos cuando pasa del minuto", async () => {
    const cuerpo = await jsonTooManyRequests(120).json();

    expect(cuerpo.message).toContain("2 minutos");
  });

  it("cuenta la espera en segundos cuando es corta", async () => {
    const cuerpo = await jsonTooManyRequests(1).json();

    // Singular: «1 segundos» delata que el mensaje se arma sin cuidado.
    expect(cuerpo.message).toContain("1 segundo.");
  });
});
