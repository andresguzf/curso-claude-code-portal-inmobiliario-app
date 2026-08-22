import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FlashRegion } from "@/components/flash/flash-region";
import { flashError, flashSuccess, resetFlashForTests } from "@/lib/flash";

beforeEach(() => {
  window.sessionStorage.clear();
  resetFlashForTests();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

/** Deja pasar el tiempo dentro de `act`, para que React aplique el cambio. */
async function avanzar(milisegundos: number) {
  await act(async () => {
    vi.advanceTimersByTime(milisegundos);
  });
}

describe("FlashRegion", () => {
  it("no pinta nada cuando no hay mensajes", () => {
    const { container } = render(<FlashRegion />);

    // Un contenedor vacío empujaría la página y la movería al primer aviso.
    expect(container).toBeEmptyDOMElement();
  });

  it("recoge lo que quedó en la cola antes de montarse", () => {
    // Este es el caso de entrar como ADMIN: el aviso se publica en el portal
    // y se pinta ya en el panel, que es otro documento.
    flashSuccess("Sesión iniciada.");
    render(<FlashRegion />);

    expect(screen.getByText("Sesión iniciada.")).toBeInTheDocument();
  });

  it("recoge lo que se publica estando ya montado", async () => {
    render(<FlashRegion />);

    await act(async () => {
      flashSuccess("Se guardaron los cambios.");
    });

    expect(screen.getByText("Se guardaron los cambios.")).toBeInTheDocument();
  });

  it("lo anuncia sin interrumpir la lectura", () => {
    flashSuccess("Se guardó.");
    render(<FlashRegion />);

    // `status` y no `alert`: confirma algo que la persona acaba de pedir.
    expect(screen.getByRole("status")).toHaveTextContent("Se guardó.");
  });

  it("desaparece solo a los cinco segundos", async () => {
    flashSuccess("Se guardó.");
    render(<FlashRegion />);

    await avanzar(4_999);
    expect(screen.queryByText("Se guardó.")).toBeInTheDocument();

    await avanzar(2);
    expect(screen.queryByText("Se guardó.")).not.toBeInTheDocument();
  });

  it("se puede cerrar antes", async () => {
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    flashSuccess("Se guardó.");
    render(<FlashRegion />);

    await usuario.click(
      screen.getByRole("button", { name: "Cerrar el aviso" }),
    );

    expect(screen.queryByText("Se guardó.")).not.toBeInTheDocument();
  });

  it("detiene la cuenta atrás mientras el puntero está encima", async () => {
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    flashSuccess("Un mensaje largo que hay que terminar de leer.");
    render(<FlashRegion />);

    await usuario.hover(screen.getByRole("status"));
    await avanzar(8_000);

    // Un aviso que se va a media lectura no ha informado a nadie.
    expect(
      screen.getByText("Un mensaje largo que hay que terminar de leer."),
    ).toBeInTheDocument();
  });

  it("reanuda la cuenta atrás al retirar el puntero", async () => {
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    flashSuccess("Se guardó.");
    render(<FlashRegion />);

    const aviso = screen.getByRole("status");
    await usuario.hover(aviso);
    await avanzar(8_000);
    await usuario.unhover(aviso);
    await avanzar(5_001);

    expect(screen.queryByText("Se guardó.")).not.toBeInTheDocument();
  });

  it("cerrar uno no cierra el otro", async () => {
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    flashSuccess("El primero.");
    flashError("El segundo.");
    render(<FlashRegion />);

    const [cerrarPrimero] = screen.getAllByRole("button", {
      name: "Cerrar el aviso",
    });
    await usuario.click(cerrarPrimero as HTMLElement);

    expect(screen.queryByText("El primero.")).not.toBeInTheDocument();
    expect(screen.getByText("El segundo.")).toBeInTheDocument();
  });

  it("distingue el error de la confirmación", () => {
    flashError("No pudimos guardar.");
    render(<FlashRegion />);

    expect(screen.getByRole("status").className).toContain("border-danger");
  });

  it("el mensaje sigue en la cola mientras se muestra", () => {
    // Este es el caso que falló en el navegador: si la región lo sacara de
    // la cola al pintarlo, una navegación inmediata se lo llevaría y el aviso
    // no llegaría nunca a la página siguiente.
    flashSuccess("Sesión iniciada.");
    render(<FlashRegion />);

    expect(screen.getByText("Sesión iniciada.")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("portal:flash")).toContain(
      "Sesión iniciada.",
    );
  });

  it("cerrarlo lo saca también de la cola", async () => {
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    flashSuccess("Se guardó.");
    render(<FlashRegion />);

    await usuario.click(
      screen.getByRole("button", { name: "Cerrar el aviso" }),
    );

    // Si se quedara en la cola, reaparecería en la siguiente navegación.
    expect(window.sessionStorage.getItem("portal:flash")).not.toContain(
      "Se guardó.",
    );
  });

  it("al irse solo tampoco queda en la cola", async () => {
    flashSuccess("Se guardó.");
    render(<FlashRegion />);

    await avanzar(5_001);

    expect(window.sessionStorage.getItem("portal:flash")).not.toContain(
      "Se guardó.",
    );
  });
});
