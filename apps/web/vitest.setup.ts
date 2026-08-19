import "@testing-library/jest-dom/vitest";

/**
 * jsdom no implementa `scrollIntoView`, que todos los navegadores actuales sí
 * ofrecen. Se suple aquí en lugar de proteger el código de producción contra
 * una carencia que solo existe en las pruebas.
 */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

/**
 * jsdom no implementa el diálogo modal, que todos los navegadores actuales
 * sí tienen. Se suple aquí y no en el componente: el código de producción no
 * debe cargar con las carencias del entorno de prueba.
 */
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(
    this: HTMLDialogElement,
  ) {
    this.open = true;
  };

  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}
