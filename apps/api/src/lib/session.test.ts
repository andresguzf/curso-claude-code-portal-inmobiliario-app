import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";

import {
  buildSessionCookieOptions,
  createSessionToken,
  readAuthSecret,
  readSessionToken,
} from "./session";

const SECRET = new TextEncoder().encode(
  "un secreto de pruebas suficientemente largo",
);
const OTHER_SECRET = new TextEncoder().encode(
  "otro secreto completamente distinto",
);

describe("readAuthSecret", () => {
  it("acepta un secreto configurado", () => {
    expect(readAuthSecret("secreto")).toEqual(
      new TextEncoder().encode("secreto"),
    );
  });

  it("lanza si falta, en vez de usar uno por defecto", () => {
    // Un secreto predecible permitiría a cualquiera fabricar sesiones.
    expect(() => readAuthSecret("")).toThrow("AUTH_SECRET");
    expect(() => readAuthSecret("   ")).toThrow("AUTH_SECRET");
    expect(() => readAuthSecret(undefined)).toThrow("AUTH_SECRET");
  });
});

describe("createSessionToken y readSessionToken", () => {
  it("devuelve el usuario que firmó el testigo", async () => {
    const token = await createSessionToken("usuario-1", SECRET);

    expect(await readSessionToken(token, SECRET)).toBe("usuario-1");
  });

  it("no lleva más datos que el identificador", async () => {
    const token = await createSessionToken("usuario-1", SECRET);
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] as string, "base64url").toString(),
    );

    // El rol se relee de la base de datos: si viajara aquí, desactivar a
    // alguien no surtiría efecto hasta que caducara su sesión.
    expect(Object.keys(payload).sort()).toEqual(["exp", "iat", "iss", "sub"]);
  });

  it("rechaza un testigo firmado con otro secreto", async () => {
    const token = await createSessionToken("usuario-1", OTHER_SECRET);

    expect(await readSessionToken(token, SECRET)).toBeNull();
  });

  it("rechaza un testigo manipulado", async () => {
    const token = await createSessionToken("usuario-1", SECRET);
    const [header, payload, signature] = token.split(".");
    const forged = [header, payload, `${signature}x`].join(".");

    expect(await readSessionToken(forged, SECRET)).toBeNull();
  });

  it("rechaza un testigo caducado", async () => {
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("usuario-1")
      .setIssuer("portal-inmobiliario")
      .setExpirationTime("-1s")
      .sign(SECRET);

    expect(await readSessionToken(expired, SECRET)).toBeNull();
  });

  it("rechaza un testigo emitido por otro sistema", async () => {
    const foreign = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("usuario-1")
      .setIssuer("otro-sistema")
      .setExpirationTime("1h")
      .sign(SECRET);

    expect(await readSessionToken(foreign, SECRET)).toBeNull();
  });

  it("trata la ausencia de testigo como ausencia de sesión", async () => {
    expect(await readSessionToken(undefined, SECRET)).toBeNull();
    expect(await readSessionToken("", SECRET)).toBeNull();
    expect(await readSessionToken("no-es-un-jwt", SECRET)).toBeNull();
  });
});

describe("buildSessionCookieOptions", () => {
  it("impide que el JavaScript de la página lea la sesión", () => {
    expect(buildSessionCookieOptions(false).httpOnly).toBe(true);
  });

  it("exige HTTPS en producción y no en desarrollo", () => {
    expect(buildSessionCookieOptions(true).secure).toBe(true);
    expect(buildSessionCookieOptions(false).secure).toBe(false);
  });

  it("caduca a la semana", () => {
    expect(buildSessionCookieOptions(false).maxAge).toBe(604800);
  });
});
