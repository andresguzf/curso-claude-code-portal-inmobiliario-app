import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { addFavorite, removeFavorite, refresh } = vi.hoisted(() => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({ addFavorite, removeFavorite }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn(), push: vi.fn() }),
}));

import { FavoriteButton } from "./favorite-button";

function renderButton(isFavorite: boolean) {
  return render(
    <FavoriteButton
      propertyId="p1"
      propertyTitle="Casa en Las Condes"
      isFavorite={isFavorite}
    />,
  );
}

afterEach(() => {
  addFavorite.mockReset();
  removeFavorite.mockReset();
  refresh.mockReset();
});

describe("FavoriteButton", () => {
  it("dice qué hará, nombrando la propiedad", () => {
    renderButton(false);

    expect(
      screen.getByRole("button", {
        name: "Guardar Casa en Las Condes en tus propiedades",
      }),
    ).toBeInTheDocument();
  });

  it("cambia el texto cuando ya está guardada", () => {
    renderButton(true);

    expect(
      screen.getByRole("button", {
        name: "Quitar Casa en Las Condes de tus guardadas",
      }),
    ).toBeInTheDocument();
  });

  it("comunica su estado con aria-pressed", () => {
    renderButton(true);

    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("guarda la propiedad al pulsar", async () => {
    const user = userEvent.setup();

    addFavorite.mockResolvedValue(undefined);
    renderButton(false);
    await user.click(screen.getByRole("button"));

    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith("p1"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("la quita si ya estaba guardada", async () => {
    const user = userEvent.setup();

    removeFavorite.mockResolvedValue(undefined);
    renderButton(true);
    await user.click(screen.getByRole("button"));

    await waitFor(() => expect(removeFavorite).toHaveBeenCalledWith("p1"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("se marca antes de que responda el servidor", async () => {
    const user = userEvent.setup();

    addFavorite.mockReturnValue(new Promise(() => {}));
    renderButton(false);
    await user.click(screen.getByRole("button"));

    // Esperar la respuesta dejaría el botón inerte en cada clic.
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("deshace la marca si el servidor rechaza", async () => {
    const user = userEvent.setup();

    addFavorite.mockRejectedValue(new Error("no se pudo"));
    renderButton(false);
    await user.click(screen.getByRole("button"));

    // Quedaría marcado algo que no está guardado.
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-pressed",
        "false",
      ),
    );
  });

  it("pide al servidor repintar, porque la cuenta lista las guardadas", async () => {
    const user = userEvent.setup();

    addFavorite.mockResolvedValue(undefined);
    renderButton(false);
    await user.click(screen.getByRole("button"));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
