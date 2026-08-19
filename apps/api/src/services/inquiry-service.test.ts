import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createInquiry: vi.fn(),
  findUserInquiries: vi.fn(),
  hideInquiryFromUser: vi.fn(),
  findPropertyById: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/repositories/inquiry-repository", () => ({
  createInquiry: mocks.createInquiry,
  findUserInquiries: mocks.findUserInquiries,
  hideInquiryFromUser: mocks.hideInquiryFromUser,
}));
vi.mock("@/repositories/property-repository", () => ({
  findPropertyById: mocks.findPropertyById,
}));

import {
  createInquiry,
  hideInquiry,
  listUserInquiries,
} from "./inquiry-service";

const VALID = {
  propertyId: "seed-property-01",
  name: "Ana Pérez",
  email: "ana@example.com",
  message: "Me interesa esta propiedad, ¿podemos coordinar?",
};

afterEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }
});

describe("createInquiry", () => {
  it("guarda la consulta y devuelve su identificador", async () => {
    mocks.findPropertyById.mockResolvedValue({ id: "seed-property-01" });
    mocks.createInquiry.mockResolvedValue({ id: "c1" });

    expect(await createInquiry(VALID, null)).toEqual({
      status: "created",
      id: "c1",
    });
  });

  it("asocia la consulta a quien tiene sesión", async () => {
    mocks.findPropertyById.mockResolvedValue({ id: "seed-property-01" });
    mocks.createInquiry.mockResolvedValue({ id: "c1" });

    await createInquiry(VALID, "u1");

    expect(mocks.createInquiry).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1" }),
    );
  });

  it("acepta la consulta de un visitante, sin usuario", async () => {
    // El portal admite consultas sin cuenta (spec.md, sección 14).
    mocks.findPropertyById.mockResolvedValue({ id: "seed-property-01" });
    mocks.createInquiry.mockResolvedValue({ id: "c1" });

    await createInquiry(VALID, null);

    expect(mocks.createInquiry).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null }),
    );
  });

  it("guarda el teléfono como nulo cuando no se indica", async () => {
    mocks.findPropertyById.mockResolvedValue({ id: "seed-property-01" });
    mocks.createInquiry.mockResolvedValue({ id: "c1" });

    await createInquiry(VALID, null);

    expect(mocks.createInquiry).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null }),
    );
  });

  it("no guarda nada si la consulta es inválida", async () => {
    const outcome = await createInquiry({ ...VALID, email: "ana" }, null);

    expect(outcome).toMatchObject({ status: "invalid" });
    expect(mocks.createInquiry).not.toHaveBeenCalled();
  });

  it("no guarda nada sobre una propiedad despublicada", async () => {
    mocks.findPropertyById.mockResolvedValue(null);

    expect(await createInquiry(VALID, null)).toEqual({
      status: "property-not-found",
    });
    expect(mocks.createInquiry).not.toHaveBeenCalled();
  });

  it("usa el identificador de la propiedad hallada, no el enviado", async () => {
    mocks.findPropertyById.mockResolvedValue({ id: "seed-property-01" });
    mocks.createInquiry.mockResolvedValue({ id: "c1" });

    await createInquiry({ ...VALID, propertyId: "  seed-property-01  " }, null);

    expect(mocks.createInquiry).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: "seed-property-01" }),
    );
  });
});

describe("listUserInquiries", () => {
  function buildInquiry(id: string) {
    return {
      id,
      message: "Me interesa esta propiedad.",
      createdAt: new Date("2026-02-01T10:00:00.000Z"),
      property: {
        id: "p1",
        title: "Casa en Las Condes",
        images: [{ url: "https://example.test/1.jpg" }],
      },
    };
  }

  it("devuelve la página con su total y su tamaño", async () => {
    mocks.findUserInquiries.mockResolvedValue({
      inquiries: [buildInquiry("c1")],
      total: 13,
    });

    const page = await listUserInquiries("u1");

    expect(page).toMatchObject({ total: 13, page: 1, pageSize: 6 });
    expect(page.data[0]).toEqual({
      id: "c1",
      message: "Me interesa esta propiedad.",
      createdAt: "2026-02-01T10:00:00.000Z",
      property: {
        id: "p1",
        title: "Casa en Las Condes",
        imageUrl: "https://example.test/1.jpg",
      },
    });
  });

  it("salta las páginas anteriores", async () => {
    mocks.findUserInquiries.mockResolvedValue({ inquiries: [], total: 0 });

    await listUserInquiries("u1", { page: 3 });

    expect(mocks.findUserInquiries).toHaveBeenCalledWith("u1", {
      search: "",
      skip: 12,
      take: 6,
    });
  });

  it("trata una página inválida como la primera", async () => {
    mocks.findUserInquiries.mockResolvedValue({ inquiries: [], total: 0 });

    for (const page of [0, -2, 1.5, Number.NaN, undefined]) {
      const result = await listUserInquiries("u1", { page });

      expect(result.page).toBe(1);
    }
  });

  it("recorta la búsqueda antes de consultar", async () => {
    mocks.findUserInquiries.mockResolvedValue({ inquiries: [], total: 0 });

    await listUserInquiries("u1", { search: "  piscina  " });

    expect(mocks.findUserInquiries).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ search: "piscina" }),
    );
  });

  it("admite una propiedad sin fotografía", async () => {
    const inquiry = buildInquiry("c1");

    mocks.findUserInquiries.mockResolvedValue({
      inquiries: [
        { ...inquiry, property: { ...inquiry.property, images: [] } },
      ],
      total: 1,
    });

    expect(
      (await listUserInquiries("u1")).data[0]?.property.imageUrl,
    ).toBeNull();
  });
});

describe("hideInquiry", () => {
  it("confirma cuando oculta la solicitud", async () => {
    mocks.hideInquiryFromUser.mockResolvedValue(1);

    expect(await hideInquiry("c1", "u1")).toEqual({ status: "hidden" });
  });

  it("responde «no encontrada» si no cambió ninguna fila", async () => {
    // Solicitud ajena, inexistente o ya oculta: no se distinguen.
    mocks.hideInquiryFromUser.mockResolvedValue(0);

    expect(await hideInquiry("de-otra-persona", "u1")).toEqual({
      status: "not-found",
    });
  });

  it("acota siempre por el usuario de la sesión", async () => {
    mocks.hideInquiryFromUser.mockResolvedValue(1);

    await hideInquiry("c1", "u1");

    expect(mocks.hideInquiryFromUser).toHaveBeenCalledWith("c1", "u1");
  });
});
