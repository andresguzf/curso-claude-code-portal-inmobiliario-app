import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { hideInquiry, refresh } = vi.hoisted(() => ({
  hideInquiry: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({ hideInquiry }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn(), push: vi.fn() }),
}));

import { HideInquiryButton } from "./hide-inquiry-button";

function renderButton() {
  return render(
    <HideInquiryButton inquiryId="c1" propertyTitle="Casa en Las Condes" />,
  );
}

afterEach(() => {
  hideInquiry.mockReset();
  refresh.mockReset();
});

describe("HideInquiryButton", () => {
  it("dice que quita del historial, no que borra", () => {
    // La consulta se conserva para la inmobiliaria.
    renderButton();

    expect(
      screen.getByRole("button", {
        name: "Quitar de mi historial la consulta sobre Casa en Las Condes",
      }),
    ).toBeInTheDocument();
  });

  it("no quita nada hasta que se confirma", async () => {
    const user = userEvent.setup();

    renderButton();
    await user.click(screen.getByRole("button", { name: /Quitar de mi/ }));

    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(hideInquiry).not.toHaveBeenCalled();
  });

  it("nombra la propiedad y explica que la inmobiliaria la conserva", async () => {
    const user = userEvent.setup();

    renderButton();
    await user.click(screen.getByRole("button", { name: /Quitar de mi/ }));

    const dialogo = await screen.findByRole("dialog");

    expect(dialogo).toHaveAccessibleName("Quitar de tu historial");
    expect(dialogo).toHaveTextContent("Casa en Las Condes");
    expect(dialogo).toHaveTextContent(/La inmobiliaria la conserva/);
  });

  it("al confirmar, quita la consulta y pide repintar la página", async () => {
    const user = userEvent.setup();

    hideInquiry.mockResolvedValue(undefined);
    renderButton();
    await user.click(screen.getByRole("button", { name: /Quitar de mi/ }));
    await user.click(
      await screen.findByRole("button", { name: "Sí, quitarla" }),
    );

    await waitFor(() => expect(hideInquiry).toHaveBeenCalledWith("c1"));
    expect(refresh).toHaveBeenCalled();
  });

  it("al cancelar no llama a la API y cierra el diálogo", async () => {
    const user = userEvent.setup();

    renderButton();
    await user.click(screen.getByRole("button", { name: /Quitar de mi/ }));
    await user.click(
      await screen.findByRole("button", { name: "No, conservarla" }),
    );

    expect(hideInquiry).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("avisa si el servidor rechaza, sin dejarlo en silencio", async () => {
    const user = userEvent.setup();

    hideInquiry.mockRejectedValue(new Error("no se pudo"));
    renderButton();
    await user.click(screen.getByRole("button", { name: /Quitar de mi/ }));
    await user.click(
      await screen.findByRole("button", { name: "Sí, quitarla" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent("No se pudo");
    expect(refresh).not.toHaveBeenCalled();
  });
});
