/**
 * Cola de mensajes de confirmación (spec.md, sección 23b).
 *
 * Vive en `sessionStorage` y no en un estado de React porque el portal y el
 * panel son **dos raíces distintas**, cada una con su `<html>`: entrar como
 * ADMIN lleva de un documento al otro, y cualquier cosa guardada en memoria
 * se perdería justo en la navegación que había que anunciar.
 *
 * Un mensaje sale de la cola cuando se **cierra**, no cuando se lee. La
 * diferencia importa: quien publica y quien pinta están en el mismo documento
 * en ese instante, así que vaciarla al leerla dejaba el mensaje en una página
 * que se estaba abandonando y nunca llegaba a la siguiente.
 *
 * `sessionStorage` muere al cerrar la pestaña, que es lo que dura un aviso.
 * Aquí no hay nada sensible: son frases para leer. La sesión sigue viajando
 * en una cookie `httpOnly` y no se guarda en el navegador.
 */

export type FlashTone = "success" | "error";

export type FlashMessage = {
  readonly id: string;
  readonly tone: FlashTone;
  readonly text: string;
};

const STORAGE_KEY = "portal:flash";

/** Nombre del evento con el que se avisa dentro del mismo documento. */
export const FLASH_EVENT = "portal:flash";

/** Una lista vacía estable: devolver una nueva cada vez sería un bucle. */
const NINGUNO: readonly FlashMessage[] = [];

/**
 * Copia en memoria de la cola.
 *
 * `useSyncExternalStore` compara por identidad y exige que leer no tenga
 * efectos, así que no puede consultar `sessionStorage` en cada render: se
 * guarda aquí y se refresca solo cuando algo cambia.
 */
let visibles: readonly FlashMessage[] = NINGUNO;
const oyentes = new Set<() => void>();

function notificar(): void {
  for (const oyente of oyentes) {
    oyente();
  }
}

/** Relee la cola y avisa solo si cambió. */
function sincronizar(): void {
  const guardados = leerCola();

  if (!mismosMensajes(guardados, visibles)) {
    visibles = guardados;
    notificar();
  }
}

export function publishFlash(tone: FlashTone, text: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const message: FlashMessage = { id: crearIdentificador(), tone, text };

  escribirCola([...leerCola(), message]);
  window.dispatchEvent(new CustomEvent(FLASH_EVENT));
}

/** Atajos, para no repetir el tono en cada llamada. */
export function flashSuccess(text: string): void {
  publishFlash("success", text);
}

export function flashError(text: string): void {
  publishFlash("error", text);
}

/**
 * Se suscribe a los mensajes pendientes.
 *
 * Lee la cola al suscribirse —eso cubre las navegaciones que recargan el
 * documento, como el salto del portal al panel— y también al recibir el
 * evento —eso cubre las que no—.
 */
export function subscribeFlash(oyente: () => void): () => void {
  oyentes.add(oyente);
  sincronizar();
  window.addEventListener(FLASH_EVENT, sincronizar);

  return () => {
    oyentes.delete(oyente);
    window.removeEventListener(FLASH_EVENT, sincronizar);
  };
}

export function getFlashSnapshot(): readonly FlashMessage[] {
  return visibles;
}

/** En el servidor nunca hay avisos: se publican desde el navegador. */
export function getFlashServerSnapshot(): readonly FlashMessage[] {
  return NINGUNO;
}

/** Cierra un aviso: lo quita de la cola y de la pantalla. */
export function dismissFlash(id: string): void {
  escribirCola(leerCola().filter((mensaje) => mensaje.id !== id));
  sincronizar();
}

/** Lo que hay en la cola. Se usa en las pruebas de los formularios. */
export function readFlash(): readonly FlashMessage[] {
  return leerCola();
}

/** Solo para las pruebas: deja el módulo como recién cargado. */
export function resetFlashForTests(): void {
  visibles = NINGUNO;
  oyentes.clear();
}

/**
 * Comparación por identificador.
 *
 * Cada lectura de `sessionStorage` construye objetos nuevos, así que comparar
 * las listas por referencia diría siempre que cambiaron y React repintaría
 * sin parar.
 */
function mismosMensajes(
  unos: readonly FlashMessage[],
  otros: readonly FlashMessage[],
): boolean {
  return (
    unos.length === otros.length &&
    unos.every((mensaje, indice) => mensaje.id === otros[indice]?.id)
  );
}

/**
 * `randomUUID` no existe en contextos no seguros ni en algunos navegadores
 * antiguos, y aquí solo hace falta distinguir dos mensajes en una lista.
 */
function crearIdentificador(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function leerCola(): readonly FlashMessage[] {
  try {
    const guardado = window.sessionStorage.getItem(STORAGE_KEY);
    const analizado: unknown = guardado ? JSON.parse(guardado) : [];

    return Array.isArray(analizado) ? analizado.filter(esMensaje) : NINGUNO;
  } catch {
    // Almacenamiento lleno, deshabilitado o con contenido corrupto. Perder un
    // aviso es aceptable; tumbar la página por no poder leerlo, no.
    return NINGUNO;
  }
}

function escribirCola(mensajes: readonly FlashMessage[]): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mensajes));
  } catch {
    // Igual que al leer: el aviso es prescindible, la página no.
  }
}

function esMensaje(valor: unknown): valor is FlashMessage {
  if (typeof valor !== "object" || valor === null) {
    return false;
  }

  const { id, tone, text } = valor as Record<string, unknown>;

  return (
    typeof id === "string" &&
    typeof text === "string" &&
    (tone === "success" || tone === "error")
  );
}
