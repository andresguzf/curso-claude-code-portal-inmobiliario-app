import { cn } from "@/lib/utils";

/**
 * Marca del portal.
 *
 * Un tejado sobre una fachada con puerta, dentro de una insignia terracota:
 * la silueta se reconoce incluso a 24 px, donde un dibujo con más detalle se
 * volvería una mancha.
 *
 * Es decorativa: siempre acompaña al texto «Portal Inmobiliario», así que se
 * oculta a las tecnologías de asistencia para no anunciar la marca dos veces.
 */
export function SiteLogo({ className }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 32 32"
      className={cn("size-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" className="fill-accent" />

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white"
      >
        {/* Tejado */}
        <path d="M7.5 16 16 8.5 24.5 16" />
        {/* Fachada */}
        <path d="M10 15.5V24h12v-8.5" />
        {/* Puerta */}
        <path d="M14 24v-5h4v5" />
      </g>
    </svg>
  );
}
