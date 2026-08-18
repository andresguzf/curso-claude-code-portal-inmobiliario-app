import { afterEach, describe, expect, it, vi } from "vitest";

const { submitInquiry, deliverInquiry } = vi.hoisted(() => ({
  submitInquiry: vi.fn(),
  deliverInquiry: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({ submitInquiry }));
vi.mock("@/lib/web3forms", () => ({ deliverInquiry }));

import { sendInquiry } from "./inquiry-submission";

const INQUIRY = {
  propertyId: "seed-property-01",
  name: "Ana Pérez",
  email: "ana@example.com",
  message: "Me interesa esta propiedad.",
};

afterEach(() => {
  submitInquiry.mockReset();
  deliverInquiry.mockReset();
  vi.restoreAllMocks();
});

describe("sendInquiry", () => {
  it("valida en la API antes de enviar el correo", async () => {
    const order: string[] = [];

    submitInquiry.mockImplementation(async () => {
      order.push("api");

      return { message: "Consulta enviada." };
    });
    deliverInquiry.mockImplementation(async () => {
      order.push("web3forms");

      return { status: "delivered" };
    });

    await sendInquiry(INQUIRY, "Casa en Las Condes");

    expect(order).toEqual(["api", "web3forms"]);
  });

  it("no envía correo si la API rechaza la consulta", async () => {
    submitInquiry.mockRejectedValue(new Error("El email no es válido."));

    await expect(sendInquiry(INQUIRY, "Casa")).rejects.toThrow(
      "El email no es válido.",
    );
    expect(deliverInquiry).not.toHaveBeenCalled();
  });

  it("devuelve el mensaje de la API cuando todo sale bien", async () => {
    submitInquiry.mockResolvedValue({ message: "Consulta enviada." });
    deliverInquiry.mockResolvedValue({ status: "delivered" });

    expect(await sendInquiry(INQUIRY, "Casa")).toEqual({
      message: "Consulta enviada.",
    });
  });

  it("avisa cuando falta la clave de Web3Forms", async () => {
    submitInquiry.mockResolvedValue({ message: "Consulta enviada." });
    deliverInquiry.mockResolvedValue({ status: "not-configured" });

    await expect(sendInquiry(INQUIRY, "Casa")).rejects.toThrow(
      "El envío de consultas no está disponible en este momento.",
    );
  });

  it("no da por enviada una consulta que Web3Forms rechazó", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    submitInquiry.mockResolvedValue({ message: "Consulta enviada." });
    deliverInquiry.mockResolvedValue({ status: "failed", reason: "HTTP 403" });

    await expect(sendInquiry(INQUIRY, "Casa")).rejects.toThrow(
      "No pudimos enviar tu consulta.",
    );
  });

  it("pasa a Web3Forms el título que resolvió la API", async () => {
    submitInquiry.mockResolvedValue({ message: "Consulta enviada." });
    deliverInquiry.mockResolvedValue({ status: "delivered" });

    await sendInquiry(INQUIRY, "Casa familiar con piscina");

    expect(deliverInquiry).toHaveBeenCalledWith(
      INQUIRY,
      "Casa familiar con piscina",
    );
  });
});
