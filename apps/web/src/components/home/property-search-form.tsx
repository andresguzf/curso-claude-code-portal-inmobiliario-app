/**
 * Buscador principal (spec.md, secciones 7 y 9).
 *
 * Es un formulario GET nativo: envía a `/properties` y la búsqueda queda
 * representada en los parámetros de la URL, sin JavaScript ni Server Actions.
 */
export function PropertySearchForm() {
  return (
    <form
      action="/properties"
      method="get"
      role="search"
      className="flex w-full flex-col gap-3 rounded-xl border border-black/10 bg-background/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-end dark:border-white/15"
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
          placeholder="Comuna, ciudad o palabra clave"
          className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:border-white/20"
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
          className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:border-white/20"
        >
          <option value="">Todas</option>
          <option value="SALE">Comprar</option>
          <option value="RENT">Arrendar</option>
        </select>
      </div>

      <button
        type="submit"
        className="rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        Buscar
      </button>
    </form>
  );
}
