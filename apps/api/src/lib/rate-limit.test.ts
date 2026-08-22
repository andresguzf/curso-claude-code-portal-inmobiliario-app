import { describe, expect, it } from "vitest";

import { createRateLimiter, readClientAddress } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  /** Reloj manejable: el paso del tiempo se prueba, no se espera. */
  function crearReloj(inicio = 1_000_000) {
    let ahora = inicio;

    return {
      leer: () => ahora,
      avanzar: (milisegundos: number) => {
        ahora += milisegundos;
      },
    };
  }

  it("admite hasta el límite y rechaza el siguiente", () => {
    const limitador = createRateLimiter({ limit: 3, windowMs: 60_000 });

    expect(limitador.record("1.1.1.1").allowed).toBe(true);
    expect(limitador.record("1.1.1.1").allowed).toBe(true);
    expect(limitador.record("1.1.1.1").allowed).toBe(true);
    expect(limitador.record("1.1.1.1").allowed).toBe(false);
  });

  it("cuenta cada origen por separado", () => {
    const limitador = createRateLimiter({ limit: 1, windowMs: 60_000 });

    expect(limitador.record("1.1.1.1").allowed).toBe(true);
    expect(limitador.record("1.1.1.1").allowed).toBe(false);
    // Que una dirección agote su cupo no debe dejar fuera a las demás.
    expect(limitador.record("2.2.2.2").allowed).toBe(true);
  });

  it("vuelve a admitir cuando pasa la ventana", () => {
    const reloj = crearReloj();
    const limitador = createRateLimiter({
      limit: 1,
      windowMs: 60_000,
      now: reloj.leer,
    });

    expect(limitador.record("1.1.1.1").allowed).toBe(true);
    expect(limitador.record("1.1.1.1").allowed).toBe(false);

    reloj.avanzar(60_000);

    expect(limitador.record("1.1.1.1").allowed).toBe(true);
  });

  it("dice cuántos segundos quedan, redondeando hacia arriba", () => {
    const reloj = crearReloj();
    const limitador = createRateLimiter({
      limit: 1,
      windowMs: 60_000,
      now: reloj.leer,
    });

    limitador.record("1.1.1.1");
    reloj.avanzar(59_500);

    const decision = limitador.record("1.1.1.1");

    expect(decision.allowed).toBe(false);
    // Medio segundo restante no es «0 segundos»: quien reintentara al
    // instante volvería a chocar contra la misma ventana.
    expect(decision.allowed === false && decision.retryAfterSeconds).toBe(1);
  });

  it("olvida los intentos de un origen al reiniciarlo", () => {
    const limitador = createRateLimiter({ limit: 1, windowMs: 60_000 });

    limitador.record("1.1.1.1");
    expect(limitador.record("1.1.1.1").allowed).toBe(false);

    limitador.reset("1.1.1.1");

    expect(limitador.record("1.1.1.1").allowed).toBe(true);
  });

  it("no acumula ventanas caducadas", () => {
    const reloj = crearReloj();
    const limitador = createRateLimiter({
      limit: 5,
      windowMs: 1_000,
      now: reloj.leer,
    });

    // Mil orígenes distintos, cada uno una sola vez y hace mucho tiempo.
    for (let indice = 0; indice < 1_000; indice += 1) {
      limitador.record(`origen-${indice}`);
    }

    reloj.avanzar(2_000);
    limitador.record("el que llega ahora");

    // Sin la limpieza, el mapa conservaría una entrada por cada dirección
    // que hubiera llamado alguna vez: una fuga lenta pero segura.
    expect(limitador.size()).toBe(1);
  });
});

describe("readClientAddress", () => {
  it("toma la primera dirección de x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2",
    });

    // La primera es la del cliente original: cada proxy añade la suya detrás.
    expect(readClientAddress(headers)).toBe("203.0.113.7");
  });

  it("recurre a x-real-ip cuando no hay cabecera de proxy", () => {
    expect(readClientAddress(new Headers({ "x-real-ip": "203.0.113.9" }))).toBe(
      "203.0.113.9",
    );
  });

  it("agrupa bajo un mismo nombre lo que no declara origen", () => {
    // Sin dirección no se puede distinguir: se cuentan juntas, que es más
    // estricto que darle a cada una su propio cupo.
    expect(readClientAddress(new Headers())).toBe("desconocido");
  });
});

describe("check frente a record", () => {
  it("consultar no gasta cupo", () => {
    const limitador = createRateLimiter({ limit: 1, windowMs: 60_000 });

    limitador.check("1.1.1.1");
    limitador.check("1.1.1.1");
    limitador.check("1.1.1.1");

    // Solo anotar cuenta. Es lo que permite comprobar antes de trabajar y
    // apuntar después, cuando ya se sabe si el intento falló.
    expect(limitador.check("1.1.1.1").allowed).toBe(true);
    expect(limitador.record("1.1.1.1").allowed).toBe(true);
    expect(limitador.check("1.1.1.1").allowed).toBe(false);
  });

  it("consultar un origen agotado dice cuánto falta", () => {
    const limitador = createRateLimiter({ limit: 1, windowMs: 60_000 });

    limitador.record("1.1.1.1");
    const decision = limitador.check("1.1.1.1");

    expect(decision.allowed).toBe(false);
    expect(decision.allowed === false && decision.retryAfterSeconds).toBe(60);
  });

  it("consultar un origen sin ventana no la crea", () => {
    const limitador = createRateLimiter({ limit: 5, windowMs: 60_000 });

    limitador.check("nadie");

    // Si consultar creara ventana, el mapa crecería con cada dirección que
    // se asomara, aunque nunca llegara a intentar nada.
    expect(limitador.size()).toBe(0);
  });
});
