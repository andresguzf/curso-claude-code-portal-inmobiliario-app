/**
 * Buscador principal (spec.md, secciones 7 y 9).
 *
 * Es un formulario GET nativo: envía a `/properties` y la búsqueda queda
 * representada en los parámetros de la URL, sin JavaScript ni Server Actions.
 *
 * Va sobre una tarjeta clara dentro del hero oscuro, para que destaque como
 * la acción principal de la portada.
 */
export function PropertySearchForm() {
  return (
    <form
      action="/properties"
      method="get"
      role="search"
      className="flex w-full flex-col gap-3 rounded-xl bg-card p-4 text-ink shadow-xl sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label
          htmlFor="buscador-texto"
          className="mb-1.5 block text-sm font-medium"
        >
          ¿Dónde quieres vivir?
        </label>
        <input
          id="buscador-texto"
          type="search"
          name="search"
          placeholder="Comuna, ciudad o palabra clave…"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink"
        />
      </div>

      <div className="sm:w-48">
        <label
          htmlFor="buscador-operacion"
          className="mb-1.5 block text-sm font-medium"
        >
          Operación
        </label>
        <select
          id="buscador-operacion"
          name="operation"
          defaultValue=""
          className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink"
        >
          <option value="">Todas</option>
          <option value="SALE">Comprar</option>
          <option value="RENT">Arrendar</option>
        </select>
      </div>

      <button
        type="submit"
        className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
      >
        Buscar
      </button>
    </form>
  );
}
