import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { sendInquiry } = vi.hoisted(() => ({ sendInquiry: vi.fn() }));

vi.mock("@/lib/inquiry-submission", () => ({ sendInquiry }));

import { PropertyContactForm } from "./property-contact-form";

function renderForm(contact?: { name: string; email: string }) {
  return render(
    <PropertyContactForm
      propertyId="seed-property-01"
      propertyTitle="Casa en Las Condes"
      contact={contact}
    />,
  );
}

const DEFAULT_MESSAGE =
  "Hola, quiero más detalles sobre esta propiedad. ¿Podríamos coordinar una visita?";

/** Rellena lo imprescindible y deja el mensaje que trae el formulario. */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Nombre/), "Ana Pérez");
  await user.type(screen.getByLabelText(/Email/), "ana@example.com");
}

afterEach(() => {
  sendInquiry.mockReset();
});

describe("PropertyContactForm", () => {
  it("muestra los cuatro campos que exige la especificación", () => {
    renderForm();

    expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensaje/)).toBeInTheDocument();
  });

  it("indica que el teléfono es opcional", () => {
    renderForm();

    expect(screen.getByText("Opcional")).toBeInTheDocument();
  });

  it("nombra la propiedad consultada", () => {
    renderForm();

    expect(screen.getByText("Casa en Las Condes")).toBeInTheDocument();
  });

  it("configura cada campo para el teclado que le corresponde", () => {
    renderForm();

    const email = screen.getByLabelText(/Email/);

    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("inputmode", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toHaveAttribute("spellcheck", "false");

    const phone = screen.getByLabelText(/Teléfono/);

    expect(phone).toHaveAttribute("type", "tel");
    expect(phone).toHaveAttribute("inputmode", "tel");
  });

  it("arranca con un mensaje escrito, ya enviable", () => {
    renderForm();

    expect(screen.getByLabelText(/Mensaje/)).toHaveValue(DEFAULT_MESSAGE);
  });

  it("envía el mensaje que escribe quien consulta, no el de partida", async () => {
    const user = userEvent.setup();

    sendInquiry.mockResolvedValue({ message: "Consulta enviada." });
    renderForm();
    await fillValidForm(user);
    await user.clear(screen.getByLabelText(/Mensaje/));
    await user.type(
      screen.getByLabelText(/Mensaje/),
      "¿Acepta crédito hipotecario?",
    );
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    await waitFor(() => expect(sendInquiry).toHaveBeenCalledTimes(1));
    expect(sendInquiry).toHaveBeenCalledWith(
      expect.objectContaining({ message: "¿Acepta crédito hipotecario?" }),
      "Casa en Las Condes",
    );
  });

  it("no envía nada si faltan datos y explica qué corregir", async () => {
    const user = userEvent.setup();

    renderForm();
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(await screen.findByText("Escribe tu nombre.")).toBeVisible();
    expect(sendInquiry).not.toHaveBeenCalled();
  });

  it("asocia el error al campo para quien no lo ve", async () => {
    const user = userEvent.setup();

    renderForm();
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    const name = await screen.findByLabelText(/Nombre/);

    await waitFor(() => expect(name).toHaveAttribute("aria-invalid", "true"));
    expect(name).toHaveAccessibleDescription("Escribe tu nombre.");
  });

  it("rechaza un email mal escrito antes de llamar a la API", async () => {
    const user = userEvent.setup();

    renderForm();
    await user.type(screen.getByLabelText(/Nombre/), "Ana Pérez");
    await user.type(screen.getByLabelText(/Email/), "ana");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(
      await screen.findByText("Revisa tu email: parece incompleto."),
    ).toBeVisible();
    expect(sendInquiry).not.toHaveBeenCalled();
  });

  it("envía la consulta con el identificador de la propiedad", async () => {
    const user = userEvent.setup();

    sendInquiry.mockResolvedValue({ message: "Consulta enviada." });
    renderForm();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    await waitFor(() => expect(sendInquiry).toHaveBeenCalledTimes(1));
    expect(sendInquiry).toHaveBeenCalledWith(
      {
        propertyId: "seed-property-01",
        name: "Ana Pérez",
        email: "ana@example.com",
        phone: "",
        message: DEFAULT_MESSAGE,
      },
      "Casa en Las Condes",
    );
  });

  it("avisa mientras la consulta está saliendo", async () => {
    const user = userEvent.setup();
    let resolveSubmission: (value: { message: string }) => void = () => {};

    sendInquiry.mockReturnValue(
      new Promise<{ message: string }>((resolve) => {
        resolveSubmission = resolve;
      }),
    );

    renderForm();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    const sendingButton = await screen.findByRole("button", {
      name: "Enviando…",
    });

    expect(sendingButton).toBeDisabled();

    resolveSubmission({ message: "Consulta enviada." });

    expect(
      await screen.findByRole("button", { name: "Enviar consulta" }),
    ).toBeEnabled();
  });

  it("confirma el envío y vacía el formulario", async () => {
    const user = userEvent.setup();

    sendInquiry.mockResolvedValue({
      message: "Consulta enviada. Te responderemos a la brevedad.",
    });
    renderForm();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(
      await screen.findByText(
        "Consulta enviada. Te responderemos a la brevedad.",
      ),
    ).toBeVisible();
    expect(screen.getByLabelText(/Nombre/)).toHaveValue("");
    expect(screen.getByLabelText(/Mensaje/)).toHaveValue(DEFAULT_MESSAGE);
  });

  it("muestra el motivo que devuelve el servidor cuando falla", async () => {
    const user = userEvent.setup();

    sendInquiry.mockRejectedValue(
      new Error("No pudimos enviar tu consulta. Vuelve a intentarlo."),
    );
    renderForm();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(
      await screen.findByText(
        "No pudimos enviar tu consulta. Vuelve a intentarlo.",
      ),
    ).toBeVisible();
    // El formulario conserva lo escrito: quien reintenta no vuelve a teclearlo.
    expect(screen.getByLabelText(/Nombre/)).toHaveValue("Ana Pérez");
  });
});

describe("PropertyContactForm — con sesión iniciada", () => {
  const MARIA = { name: "María González", email: "maria@example.com" };

  it("llega con el nombre y el email ya puestos", () => {
    renderForm(MARIA);

    expect(screen.getByLabelText(/Nombre/)).toHaveValue("María González");
    expect(screen.getByLabelText(/Email/)).toHaveValue("maria@example.com");
  });

  it("deja el teléfono en blanco: la cuenta no lo guarda", () => {
    renderForm(MARIA);

    expect(screen.getByLabelText(/Teléfono/)).toHaveValue("");
  });

  it("permite responder a otra dirección", async () => {
    const user = userEvent.setup();

    sendInquiry.mockResolvedValue({ message: "ok", isEmailDelivered: true });
    renderForm(MARIA);
    await user.clear(screen.getByLabelText(/Email/));
    await user.type(screen.getByLabelText(/Email/), "otra@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    await waitFor(() =>
      expect(sendInquiry).toHaveBeenCalledWith(
        expect.objectContaining({ email: "otra@example.com" }),
        "Casa en Las Condes",
      ),
    );
  });

  it("tras enviar vuelve a los datos de la sesión, no a campos vacíos", async () => {
    const user = userEvent.setup();

    sendInquiry.mockResolvedValue({
      message: "Consulta enviada.",
      isEmailDelivered: true,
    });
    renderForm(MARIA);
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(await screen.findByText("Consulta enviada.")).toBeVisible();
    expect(screen.getByLabelText(/Nombre/)).toHaveValue("María González");
  });

  it("un visitante sigue viendo los campos vacíos", () => {
    renderForm();

    expect(screen.getByLabelText(/Nombre/)).toHaveValue("");
    expect(screen.getByLabelText(/Email/)).toHaveValue("");
  });
});
