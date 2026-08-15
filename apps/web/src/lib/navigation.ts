export type NavigationItem = {
  readonly label: string;
  readonly href: string;
};

/**
 * Navegación pública definida en `spec.md` (sección 7).
 *
 * "Comprar" y "Arrendar" apuntan al catálogo filtrado por tipo de operación,
 * de modo que el filtro queda representado en la URL.
 */
export const PUBLIC_NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Propiedades", href: "/properties" },
  { label: "Comprar", href: "/properties?operation=SALE" },
  { label: "Arrendar", href: "/properties?operation=RENT" },
];

export const LOGIN_NAVIGATION_ITEM: NavigationItem = {
  label: "Ingresar",
  href: "/login",
};

/**
 * Determina si un elemento de navegación corresponde a la ubicación actual.
 *
 * Compara la ruta y, además, el parámetro `operation`, porque "Propiedades",
 * "Comprar" y "Arrendar" comparten la misma ruta y solo se diferencian por
 * ese parámetro de consulta.
 */
export function isNavigationItemActive(
  itemHref: string,
  currentPathname: string,
  currentSearchParams: URLSearchParams,
): boolean {
  const [itemPathname, itemQueryString = ""] = itemHref.split("?");

  if (itemPathname !== currentPathname) {
    return false;
  }

  const itemSearchParams = new URLSearchParams(itemQueryString);

  return (
    itemSearchParams.get("operation") === currentSearchParams.get("operation")
  );
}
