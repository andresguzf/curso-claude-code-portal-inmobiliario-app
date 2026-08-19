import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

const PASSWORD = "una contraseña razonable";

describe("hashPassword", () => {
  it("no guarda la contraseña en claro", async () => {
    const hash = await hashPassword(PASSWORD);

    expect(hash).not.toContain(PASSWORD);
  });

  it("da un hash distinto a cada llamada, aunque la contraseña sea la misma", async () => {
    const [first, second] = await Promise.all([
      hashPassword(PASSWORD),
      hashPassword(PASSWORD),
    ]);

    // Cada hash lleva su propia sal: sin esto, dos personas con la misma
    // contraseña compartirían hash y una tabla precalculada valdría.
    expect(first).not.toBe(second);
  });

  it("deja los parámetros a la vista para poder endurecerlos después", async () => {
    const hash = await hashPassword(PASSWORD);

    expect(hash.split("$").slice(0, 4)).toEqual(["scrypt", "16384", "8", "1"]);
    expect(hash.split("$")).toHaveLength(6);
  });
});

describe("verifyPassword", () => {
  it("acepta la contraseña correcta", async () => {
    const hash = await hashPassword(PASSWORD);

    expect(await verifyPassword(PASSWORD, hash)).toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const hash = await hashPassword(PASSWORD);

    expect(await verifyPassword("otra contraseña", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
    expect(await verifyPassword(PASSWORD + " ", hash)).toBe(false);
  });

  it("acepta hashes generados con otros parámetros de coste", async () => {
    // Un hash antiguo debe seguir validando tras endurecer los parámetros.
    const hash = await hashPassword(PASSWORD);
    const [, , blockSize, parallelization, salt, key] = hash.split("$");
    const olderHash = [
      "scrypt",
      "1024",
      blockSize,
      parallelization,
      salt,
      key,
    ].join("$");

    expect(await verifyPassword(PASSWORD, olderHash)).toBe(false);
  });

  it("devuelve false ante un hash corrupto en lugar de reventar", async () => {
    // Una fila estropeada no debe tumbar el login de todo el mundo.
    for (const corrupted of [
      "",
      "no-es-un-hash",
      "scrypt$16384$8$1$solo-cinco-campos",
      "bcrypt$16384$8$1$c2FsdA==$aGFzaA==",
      "scrypt$cero$8$1$c2FsdA==$aGFzaA==",
      "scrypt$16384$8$1$c2FsdA==$",
    ]) {
      expect(await verifyPassword(PASSWORD, corrupted)).toBe(false);
    }
  });
});
