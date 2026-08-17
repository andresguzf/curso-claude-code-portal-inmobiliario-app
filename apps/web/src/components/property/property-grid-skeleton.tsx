/**
 * Marcador de posición del catálogo mientras se resuelve la consulta
 * (spec.md, sección 8).
 *
 * Reproduce la misma cuadrícula y proporciones que `PropertyGrid` para que al
 * llegar los datos no haya salto de layout. Queda oculto a las tecnologías de
 * asistencia: quien usa un lector de pantalla no gana nada oyendo cajas
 * vacías, y el estado de carga se anuncia con `aria-busy` en el contenedor.
 */

const SKELETON_CARD_COUNT = 6;

type PropertyGridSkeletonProps = {
  readonly count?: number;
  readonly className?: string;
};

export function PropertyGridSkeleton({
  count = SKELETON_CARD_COUNT,
  className,
}: PropertyGridSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          // `motion-safe` respeta a quien pide movimiento reducido: la
          // cuadrícula se muestra estática en lugar de pulsar.
          className="overflow-hidden rounded-xl border border-line bg-card motion-safe:animate-pulse"
        >
          <div className="aspect-[4/3] bg-muted" />

          <div className="flex flex-col gap-3 p-4">
            <div className="h-3 w-1/3 rounded bg-muted" />
            <div className="h-4 w-4/5 rounded bg-muted" />
            <div className="h-5 w-1/2 rounded bg-muted" />
            <div className="h-3 w-2/5 rounded bg-muted" />
            <div className="h-3 w-3/5 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
