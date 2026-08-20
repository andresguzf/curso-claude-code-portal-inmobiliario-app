"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";

import { IMAGE_LIMITS, type PropertyImageDto } from "@portal/contracts";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  deletePropertyImage,
  makePropertyImagePrimary,
  reorderPropertyImages,
  uploadPropertyImage,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

/**
 * Galería de una propiedad (spec.md, sección 20).
 *
 * Vive fuera del formulario y no dentro: cada acción se guarda al instante,
 * porque opera sobre un archivo que ya está subido. Mezclarla con el
 * borrador de los demás campos haría que cancelar la edición dejara a medias
 * algo que ya ocupa sitio en Cloudinary.
 *
 * Por el mismo motivo no hay botón de «guardar imágenes»: no habría nada
 * pendiente que guardar.
 */
export function PropertyImages({
  propertyId,
  images,
}: {
  readonly propertyId: string;
  readonly images: readonly PropertyImageDto[];
}) {
  const fieldId = useId();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [imageToRemove, setImageToRemove] = useState<PropertyImageDto | null>(
    null,
  );

  const isFull = images.length >= IMAGE_LIMITS.maxImagesPerProperty;

  /** Envuelve una acción: limpia el aviso, refresca y traduce el fallo. */
  function run(action: () => Promise<void>, fallbackMessage: string) {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : fallbackMessage,
        );
      }
    });
  }

  /**
   * Sube los archivos elegidos, de uno en uno.
   *
   * En serie y no en paralelo: la posición de cada imagen se calcula a
   * partir de la última guardada, y varias subidas simultáneas se pisarían
   * pidiendo todas la misma.
   */
  function upload(files: FileList) {
    const chosen = [...files];

    setErrorMessage(null);
    setStatusMessage(null);

    const room = IMAGE_LIMITS.maxImagesPerProperty - images.length;

    if (chosen.length > room) {
      setErrorMessage(
        `Solo caben ${room === 1 ? "una imagen más" : `${room} imágenes más`} en esta propiedad.`,
      );

      return;
    }

    // Se comprueba aquí lo mismo que comprueba el servidor: así quien elige
    // un archivo que no sirve lo sabe sin esperar la subida entera.
    const rejected = chosen.find(
      (file) =>
        !IMAGE_LIMITS.allowedMimeTypes.includes(file.type) ||
        file.size > IMAGE_LIMITS.maxBytes,
    );

    if (rejected) {
      setErrorMessage(
        `«${rejected.name}» no sirve: solo JPG, PNG, WebP o AVIF de hasta 5 MB.`,
      );

      return;
    }

    startTransition(async () => {
      let uploaded = 0;

      try {
        for (const file of chosen) {
          await uploadPropertyImage(propertyId, file);
          uploaded += 1;
          setStatusMessage(`Subidas ${uploaded} de ${chosen.length}…`);
        }

        setStatusMessage(
          uploaded === 1 ? "Imagen subida." : `${uploaded} imágenes subidas.`,
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No pudimos subir la imagen.",
        );
      } finally {
        // Lo ya subido cuenta aunque falle una del medio.
        router.refresh();

        // Sin esto, volver a elegir el mismo archivo no dispararía `change`.
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    });
  }

  function move(index: number, direction: -1 | 1) {
    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);

    reordered.splice(index + direction, 0, moved);

    run(
      () =>
        reorderPropertyImages(
          propertyId,
          reordered.map((image) => image.id),
        ),
      "No pudimos guardar el orden.",
    );
  }

  return (
    <section
      aria-labelledby={`${fieldId}-titulo`}
      className="flex flex-col gap-4"
    >
      <div>
        <h2
          id={`${fieldId}-titulo`}
          className="text-base font-semibold tracking-tight text-ink"
        >
          Imágenes
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          La primera de la lista es la portada. Los cambios de esta sección se
          guardan al instante, sin esperar al botón de abajo.
        </p>
      </div>

      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
          Esta propiedad todavía no tiene imágenes.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id}>
              <ImageCard
                image={image}
                index={index}
                total={images.length}
                isPending={isPending}
                onMove={move}
                onMakePrimary={() =>
                  run(
                    () => makePropertyImagePrimary(propertyId, image.id),
                    "No pudimos cambiar la imagen principal.",
                  )
                }
                onRemove={() => setImageToRemove(image)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={`${fieldId}-file`}
          className={cn(
            "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-muted",
            (isPending || isFull) && "cursor-not-allowed opacity-70",
          )}
        >
          Añadir imágenes
        </label>

        <input
          ref={fileInputRef}
          id={`${fieldId}-file`}
          type="file"
          multiple
          accept={IMAGE_LIMITS.allowedMimeTypes.join(",")}
          disabled={isPending || isFull}
          onChange={(event) => {
            if (event.target.files?.length) {
              upload(event.target.files);
            }
          }}
          className="sr-only"
        />

        <p className="text-xs text-ink-muted">
          {isFull
            ? `Máximo alcanzado: ${IMAGE_LIMITS.maxImagesPerProperty} imágenes.`
            : `JPG, PNG, WebP o AVIF · hasta 5 MB · ${images.length} de ${IMAGE_LIMITS.maxImagesPerProperty}`}
        </p>
      </div>

      <p aria-live="polite" className="text-sm text-ink-muted">
        {statusMessage}
      </p>

      <p aria-live="polite" className="text-sm text-danger">
        {errorMessage}
      </p>

      <ConfirmDialog
        isOpen={imageToRemove !== null}
        title="Eliminar la imagen"
        description="La imagen se borra de la propiedad y de Cloudinary. No se puede deshacer; habría que volver a subirla."
        confirmLabel="Sí, eliminarla"
        cancelLabel="No, conservarla"
        pendingLabel="Eliminando…"
        isPending={isPending}
        onConfirm={() => {
          const target = imageToRemove;

          if (!target) {
            return;
          }

          setImageToRemove(null);
          run(
            () => deletePropertyImage(propertyId, target.id),
            "No pudimos eliminar la imagen.",
          );
        }}
        onCancel={() => setImageToRemove(null)}
      />
    </section>
  );
}

function ImageCard({
  image,
  index,
  total,
  isPending,
  onMove,
  onMakePrimary,
  onRemove,
}: {
  readonly image: PropertyImageDto;
  readonly index: number;
  readonly total: number;
  readonly isPending: boolean;
  readonly onMove: (index: number, direction: -1 | 1) => void;
  readonly onMakePrimary: () => void;
  readonly onRemove: () => void;
}) {
  const position = `${index + 1} de ${total}`;

  return (
    <figure className="flex flex-col gap-2 rounded-xl border border-line bg-card p-2">
      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
        <Image
          src={image.url}
          alt=""
          fill
          sizes="(min-width: 1024px) 12rem, 45vw"
          className="object-cover"
        />

        {image.isPrimary ? (
          <span className="absolute top-1 left-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-ink">
            Portada
          </span>
        ) : null}
      </div>

      <figcaption className="sr-only">Imagen {position}</figcaption>

      <div className="flex items-center justify-between gap-1">
        <div className="flex gap-1">
          <IconButton
            label={`Mover la imagen ${position} hacia atrás`}
            isDisabled={isPending || index === 0}
            onClick={() => onMove(index, -1)}
          >
            ←
          </IconButton>
          <IconButton
            label={`Mover la imagen ${position} hacia adelante`}
            isDisabled={isPending || index === total - 1}
            onClick={() => onMove(index, 1)}
          >
            →
          </IconButton>
        </div>

        <IconButton
          label={`Eliminar la imagen ${position}`}
          isDisabled={isPending}
          onClick={onRemove}
          isDangerous
        >
          ✕
        </IconButton>
      </div>

      {image.isPrimary ? null : (
        <button
          type="button"
          onClick={onMakePrimary}
          disabled={isPending}
          className="min-h-9 rounded-lg border border-line text-xs font-medium text-ink transition-colors hover:bg-muted disabled:cursor-progress disabled:opacity-70"
        >
          Hacer portada
          <span className="sr-only"> con la imagen {position}</span>
        </button>
      )}
    </figure>
  );
}

/**
 * Botón de un solo símbolo.
 *
 * El símbolo es decorativo y el nombre accesible va aparte: «←» a secas no
 * dice qué mueve ni cuál de las doce imágenes es.
 */
function IconButton({
  label,
  isDisabled,
  isDangerous = false,
  onClick,
  children,
}: {
  readonly label: string;
  readonly isDisabled: boolean;
  readonly isDangerous?: boolean;
  readonly onClick: () => void;
  readonly children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border border-line text-sm transition-colors disabled:opacity-40",
        isDangerous
          ? "text-ink-muted hover:border-danger hover:text-danger"
          : "text-ink hover:bg-muted",
      )}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
