import "@testing-library/jest-dom/vitest";

/**
 * jsdom no implementa `scrollIntoView`, que todos los navegadores actuales sí
 * ofrecen. Se suple aquí en lugar de proteger el código de producción contra
 * una carencia que solo existe en las pruebas.
 */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
