import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildWeb3FormsPayload,
  deliverInquiry,
  readWeb3FormsAccessKey,
} from "./web3forms";

const INQUIRY = {
  propertyId: "seed-property-01",
  name: "Ana Pérez",
  email: "ana@example.com",
  phone: "+56 9 1234 5678",
  message: "Me interesa esta propiedad.",
};

function stubFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  }));

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY", "clave-de-prueba");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("readWeb3FormsAccessKey", () => {
  it("trata una clave vacía o en blanco como ausente", () => {
    expect(readWeb3FormsAccessKey("")).toBeNull();
    expect(readWeb3FormsAccessKey("   ")).toBeNull();
    expect(readWeb3FormsAccessKey("clave")).toBe("clave");
  });
});

describe("buildWeb3FormsPayload", () => {
  const payload = buildWeb3FormsPayload(INQUIRY, "Casa en Las Condes", "clave");

  it("identifica la propiedad en el asunto y en el cuerpo", () => {
    expect(payload.subject).toBe("Consulta sobre Casa en Las Condes");
    expect(payload.Propiedad).toBe("Casa en Las Condes");
    expect(payload["ID de propiedad"]).toBe("seed-property-01");
  });

  it("incluye los datos de contacto del visitante", () => {
    expect(payload).toMatchObject({
      name: "Ana Pérez",
      email: "ana@example.com",
      phone: "+56 9 1234 5678",
      message: "Me interesa esta propiedad.",
    });
  });

  it("deja constancia cuando no hay teléfono", () => {
    expect(
      buildWeb3FormsPayload(
        { ...INQUIRY, phone: undefined },
        "Casa en Las Condes",
        "clave",
      ).phone,
    ).toBe("No indicado");
  });
});

describe("deliverInquiry", () => {
  it("da por enviada una consulta que Web3Forms acepta", async () => {
    stubFetch({ success: true });

    expect(await deliverInquiry(INQUIRY, "Casa")).toEqual({
      status: "delivered",
    });
  });

  it("avisa cuando falta la clave, en lugar de intentar el envío", async () => {
    vi.stubEnv("NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY", "");
    const fetchMock = stubFetch({ success: true });

    expect(await deliverInquiry(INQUIRY, "Casa")).toEqual({
      status: "not-configured",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no da por enviada una respuesta 200 con success falso", async () => {
    // Web3Forms responde 200 aunque rechace la consulta: fiarse solo del
    // código HTTP daría por enviado algo que nunca salió.
    stubFetch({ success: false, message: "Clave inválida" });

    expect(await deliverInquiry(INQUIRY, "Casa")).toMatchObject({
      status: "failed",
    });
  });

  it("informa del fallo cuando Web3Forms responde con error", async () => {
    stubFetch({}, false);

    expect(await deliverInquiry(INQUIRY, "Casa")).toEqual({
      status: "failed",
      reason: "HTTP 500",
    });
  });

  it("informa del fallo cuando la red se cae", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("red caída");
      }),
    );

    expect(await deliverInquiry(INQUIRY, "Casa")).toEqual({
      status: "failed",
      reason: "red caída",
    });
  });

  it("envía la clave a Web3Forms y no la expone en el resultado", async () => {
    const fetchMock = stubFetch({ success: true });

    const result = await deliverInquiry(INQUIRY, "Casa");
    const [, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      { body: string },
    ];

    expect(JSON.parse(options.body).access_key).toBe("clave-de-prueba");
    expect(JSON.stringify(result)).not.toContain("clave-de-prueba");
  });
});
