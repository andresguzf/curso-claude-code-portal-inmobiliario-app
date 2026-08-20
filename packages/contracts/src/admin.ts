/**
 * Indicadores del panel de administración (spec.md, sección 18).
 *
 * Las propiedades se cuentan enteras, borradores incluidos: quien administra
 * necesita saber qué hay, no solo qué está visible. Para eso está aparte el
 * recuento de publicadas.
 */
export type AdminOverviewDto = {
  readonly totalProperties: number;
  readonly publishedProperties: number;
  readonly propertiesForSale: number;
  readonly propertiesForRent: number;
  readonly users: number;
  readonly inquiries: number;
};
