"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

import { INQUIRY_LIMITS } from "@portal/contracts";

import {
  fieldErrorAttributes,
  fieldInputClassName,
  FormField,
} from "@/components/form/form-field";
import { sendInquiry } from "@/lib/inquiry-submission";
import {
  inquirySchema,
  type InquiryFormValues,
} from "@/schemas/inquiry-schema";
import { cn } from "@/lib/utils";

/**
 * Formulario de consulta sobre una propiedad (spec.md, sección 14).
 *
 * El identificador de la propiedad se añade solo, sin pedírselo a nadie, y el
 * título lo resuelve el backend desde PostgreSQL: así el correo que recibe la
 * inmobiliaria nombra la propiedad real y no la que dijera el navegador.
 */

/**
 * Mensaje con el que arranca el formulario.
 *
 * Enfrentarse a un campo vacío frena a mucha gente. Un texto de partida ya
 * enviable baja esa barrera, y quien quiera concretar lo edita: es un valor
 * real del campo, no un marcador de posición.
 */
const DEFAULT_MESSAGE =
  "Hola, quiero más detalles sobre esta propiedad. ¿Podríamos coordinar una visita?";

/**
 * Estado inicial del formulario, y también al que vuelve tras un envío.
 *
 * Se declaran los cuatro campos, y no solo el mensaje, porque `reset` fija
 * exactamente los valores que recibe: omitir uno lo dejaría con lo que
 * hubiera tecleado la persona anterior.
 */
const INITIAL_VALUES: InquiryFormValues = {
  name: "",
  email: "",
  phone: "",
  message: DEFAULT_MESSAGE,
};

type SubmissionResult =
  | { readonly kind: "idle" }
  | { readonly kind: "sent"; readonly message: string }
  | { readonly kind: "error"; readonly message: string };

export function PropertyContactForm({
  propertyId,
  propertyTitle,
}: {
  readonly propertyId: string;
  readonly propertyTitle: string;
}) {
  const fieldId = useId();
  const [result, setResult] = useState<SubmissionResult>({ kind: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: INITIAL_VALUES,
    // La validación al enviar evita regañar mientras se escribe; a partir de
    // ahí corrige en vivo, que es cuando el aviso ayuda.
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  async function onSubmit(values: InquiryFormValues) {
    setResult({ kind: "idle" });

    try {
      const response = await sendInquiry(
        { ...values, propertyId },
        propertyTitle,
      );

      reset(INITIAL_VALUES);
      setResult({ kind: "sent", message: response.message });
    } catch (error) {
      setResult({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "No pudimos enviar tu consulta. Vuelve a intentarlo.",
      });
    }
  }

  return (
    <section aria-labelledby="titulo-contacto">
      <h2 id="titulo-contacto" className="text-xl font-semibold tracking-tight">
        Consultar por esta propiedad
      </h2>

      <p className="mt-2 text-sm text-ink-muted">
        Escríbenos y te responderemos sobre{" "}
        <span className="font-medium text-ink">{propertyTitle}</span>.
      </p>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-5 rounded-xl border border-line bg-card p-5 sm:p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id={`${fieldId}-name`}
            label="Nombre"
            error={errors.name?.message}
          >
            <input
              id={`${fieldId}-name`}
              type="text"
              autoComplete="name"
              maxLength={INQUIRY_LIMITS.maxNameLength}
              {...fieldErrorAttributes(`${fieldId}-name`, Boolean(errors.name))}
              className={fieldInputClassName(Boolean(errors.name))}
              {...register("name")}
            />
          </FormField>

          <FormField
            id={`${fieldId}-email`}
            label="Email"
            error={errors.email?.message}
          >
            <input
              id={`${fieldId}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              maxLength={INQUIRY_LIMITS.maxEmailLength}
              {...fieldErrorAttributes(
                `${fieldId}-email`,
                Boolean(errors.email),
              )}
              className={fieldInputClassName(Boolean(errors.email))}
              {...register("email")}
            />
          </FormField>
        </div>

        <FormField
          id={`${fieldId}-phone`}
          label="Teléfono"
          hint="Opcional"
          error={errors.phone?.message}
        >
          <input
            id={`${fieldId}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={INQUIRY_LIMITS.maxPhoneLength}
            {...fieldErrorAttributes(`${fieldId}-phone`, Boolean(errors.phone))}
            className={fieldInputClassName(Boolean(errors.phone))}
            {...register("phone")}
          />
        </FormField>

        <FormField
          id={`${fieldId}-message`}
          label="Mensaje"
          error={errors.message?.message}
        >
          <textarea
            id={`${fieldId}-message`}
            rows={5}
            maxLength={INQUIRY_LIMITS.maxMessageLength}
            {...fieldErrorAttributes(
              `${fieldId}-message`,
              Boolean(errors.message),
            )}
            className={cn(
              fieldInputClassName(Boolean(errors.message)),
              "resize-y",
            )}
            {...register("message")}
          />
        </FormField>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong disabled:cursor-progress disabled:opacity-70"
          >
            {isSubmitting ? "Enviando…" : "Enviar consulta"}
          </button>

          {/* Los cambios de estado se anuncian: quien no ve la pantalla debe
              enterarse de que la consulta salió, o de que no salió. */}
          <p
            aria-live="polite"
            className={cn(
              "text-sm",
              result.kind === "error" ? "text-accent-strong" : "text-ink-muted",
            )}
          >
            {result.kind === "idle" ? "" : result.message}
          </p>
        </div>
      </form>
    </section>
  );
}
