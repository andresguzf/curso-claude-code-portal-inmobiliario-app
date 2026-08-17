import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPublicPropertyById } from "./api-client";

/**
 * Estas pruebas cubren cómo se interpretan las respuestas HTTP, que es donde
 * se decide si una propiedad «no existe» o si «no se pudo consultar».
 */

function respondWith(status: number, body: unknown = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("fetchPublicPropertyById", () => {
  it("devuelve el detalle cuando la API responde 200", async () => {
    respondWith(200, { id: "seed-property-01", title: "Casa" });

    const property = await fetchPublicPropertyById("seed-property-01");

    expect(property?.id).toBe("seed-property-01");
  });

  it("devuelve null ante un 404, sin lanzar", async () => {
    respondWith(404, { message: "Propiedad no encontrada.", status: 404 });

    await expect(fetchPublicPropertyById("no-existe")).resolves.toBeNull();
  });

  it("lanza ante cualquier otro fallo, para no confundirlo con un 404", async () => {
    respondWith(500, { message: "Error", status: 500 });

    await expect(fetchPublicPropertyById("seed-property-01")).rejects.toThrow(
      /500/,
    );
  });

  it("codifica el identificador en la URL", async () => {
    const fetchMock = respondWith(200, {});

    await fetchPublicPropertyById("id con espacios/y-barra");

    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      "id%20con%20espacios%2Fy-barra",
    );
  });

  it("no cachea la respuesta: el estado de publicación puede cambiar", async () => {
    const fetchMock = respondWith(200, {});

    await fetchPublicPropertyById("seed-property-01");

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ cache: "no-store" });
  });
});
