import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  dismissFlash,
  FLASH_EVENT,
  flashError,
  flashSuccess,
  publishFlash,
  readFlash,
  resetFlashForTests,
} from "@/lib/flash";

beforeEach(() => {
  window.sessionStorage.clear();
  resetFlashForTests();
});

describe("publishFlash", () => {
  it("guarda el mensaje con su tono", () => {
    publishFlash("success", "Se guardó.");

    expect(readFlash()).toEqual([
      expect.objectContaining({ tone: "success", text: "Se guardó." }),
    ]);
  });

  it("conserva el orden de varios mensajes", () => {
    flashSuccess("primero");
    flashError("segundo");

    expect(readFlash().map((m) => m.text)).toEqual(["primero", "segundo"]);
  });

  it("da un identificador distinto a cada uno", () => {
    flashSuccess("mismo texto");
    flashSuccess("mismo texto");

    const [uno, otro] = readFlash();

    // Sin identificadores distintos, React trataría los dos como el mismo y
    // cerrar uno cerraría el otro.
    expect(uno?.id).not.toBe(otro?.id);
  });

  it("avisa por un evento de window", () => {
    const escucha = vi.fn();
    window.addEventListener(FLASH_EVENT, escucha);

    flashSuccess("algo");

    // El evento es lo que cubre las navegaciones que no recargan el
    // documento: sin él, el aviso esperaría al siguiente montaje.
    expect(escucha).toHaveBeenCalledTimes(1);
    window.removeEventListener(FLASH_EVENT, escucha);
  });
});

describe("readFlash y dismissFlash", () => {
  it("leer no vacía la cola", () => {
    flashSuccess("una vez");

    // El mensaje debe seguir ahí después de leerlo: quien publica y quien lo
    // pinta están en el mismo documento, y vaciarlo al leer lo dejaba en la
    // página que se estaba abandonando.
    expect(readFlash()).toHaveLength(1);
    expect(readFlash()).toHaveLength(1);
  });

  it("cerrar un aviso sí lo quita de la cola", () => {
    flashSuccess("adiós");
    const [mensaje] = readFlash();

    dismissFlash(mensaje!.id);

    expect(readFlash()).toEqual([]);
  });

  it("cerrar uno no toca a los demás", () => {
    flashSuccess("el primero");
    flashError("el segundo");
    const [primero] = readFlash();

    dismissFlash(primero!.id);

    expect(readFlash().map((m) => m.text)).toEqual(["el segundo"]);
  });

  it("sobrevive a un identificador que ya no existe", () => {
    flashSuccess("sigue aquí");

    expect(() => dismissFlash("no-existe")).not.toThrow();
    expect(readFlash()).toHaveLength(1);
  });

  it("devuelve una lista vacía cuando no hay nada", () => {
    expect(readFlash()).toEqual([]);
  });

  it("sobrevive a un almacenamiento con contenido corrupto", () => {
    window.sessionStorage.setItem("portal:flash", "{esto no es JSON");

    // Perder un aviso es aceptable; tumbar la página por no poder leerlo, no.
    expect(() => readFlash()).not.toThrow();
    expect(readFlash()).toEqual([]);
  });

  it("descarta las entradas que no tienen forma de mensaje", () => {
    window.sessionStorage.setItem(
      "portal:flash",
      JSON.stringify([{ id: "1", tone: "success", text: "válido" }, 42, null]),
    );

    expect(readFlash().map((m) => m.text)).toEqual(["válido"]);
  });
});
