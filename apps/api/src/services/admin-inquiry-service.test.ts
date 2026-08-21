import { afterEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findAdminInquiries: vi.fn(),
  createInquiry: vi.fn(),
  findUserInquiries: vi.fn(),
  hideInquiryFromUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/repositories/inquiry-repository", () => repository);

import { listAdminInquiries } from "./admin-inquiry-service";

function buildRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "inq-1",
    name: "Ana Pérez",
    email: "ana@example.com",
    phone: "+56 9 1234 5678",
    message: "Quisiera coordinar una visita.",
    createdAt: new Date("2026-08-01T12:00:00.000Z"),
    hiddenByUserAt: null,
    property: {
      id: "prop-1",
      title: "Casa en Ñuñoa",
      isPublished: true,
      deletedAt: null,
    },
    user: { id: "user-1", name: "Ana", email: "ana@example.com" },
    ...overrides,
  };
}

function arrange(records: Record<string, unknown>[]) {
  repository.findAdminInquiries.mockResolvedValue({
    inquiries: records,
    total: records.length,
  });
}

afterEach(() => {
  for (const mock of Object.values(repository)) {
    mock.mockReset();
  }
});

describe("listAdminInquiries", () => {
  it("devuelve el contacto completo de quien escribió", async () => {
    arrange([buildRecord()]);

    const page = await listAdminInquiries();

    expect(page.data[0]).toMatchObject({
      name: "Ana Pérez",
      email: "ana@example.com",
      phone: "+56 9 1234 5678",
      message: "Quisiera coordinar una visita.",
    });
  });

  it("admite una consulta de visitante, sin cuenta asociada", async () => {
    arrange([buildRecord({ user: null })]);

    expect((await listAdminInquiries()).data[0].user).toBeNull();
  });

  it("admite una consulta sin teléfono", async () => {
    // No todo el mundo quiere dejar uno.
    arrange([buildRecord({ phone: null })]);

    expect((await listAdminInquiries()).data[0].phone).toBeNull();
  });

  it("señala las que su autor quitó de su historial", async () => {
    arrange([
      buildRecord({ hiddenByUserAt: new Date("2026-08-02T00:00:00.000Z") }),
    ]);

    expect((await listAdminInquiries()).data[0].isHiddenByUser).toBe(true);
  });

  it("traduce la fecha de borrado de la propiedad a un sí o un no", async () => {
    // El momento exacto no aporta nada en esta pantalla; que ya no exista, sí.
    arrange([
      buildRecord({
        property: {
          id: "prop-1",
          title: "Casa borrada",
          isPublished: false,
          deletedAt: new Date("2026-08-03T00:00:00.000Z"),
        },
      }),
    ]);

    expect((await listAdminInquiries()).data[0].property).toMatchObject({
      title: "Casa borrada",
      isDeleted: true,
      isPublished: false,
    });
  });

  it("pagina de diez en diez", async () => {
    arrange([]);

    await listAdminInquiries({ page: 3 });

    expect(repository.findAdminInquiries).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it("trata una página fuera de rango como la primera", async () => {
    arrange([]);

    await listAdminInquiries({ page: 0 });

    expect(repository.findAdminInquiries).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 }),
    );
  });
});
