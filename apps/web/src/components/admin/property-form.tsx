"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import {
  OperationType,
  PropertyType,
  type AdminPropertyDto,
  type PropertyFeatureDto,
} from "@portal/contracts";

import {
  fieldErrorAttributes,
  fieldInputClassName,
  FormField,
} from "@/components/form/form-field";
import { createAdminProperty, updateAdminProperty } from "@/lib/api-client";
import { formatOperationType, formatPropertyType } from "@/lib/format";
import {
  propertyFormSchema,
  toPropertyInput,
  type PropertyFormValues,
} from "@/schemas/property-schema";

/**
 * Alta y edición de una propiedad (spec.md, sección 19).
 *
 * Es el mismo formulario para las dos cosas: los campos son idénticos y
 * duplicarlo garantizaría que uno se quedase atrás al añadir el siguiente.
 * Lo único que cambia es a dónde va y qué dice el botón.
 *
 * No pide latitud ni longitud: la ubicación se escribe como dirección y las
 * coordenadas las deduce el servidor al mostrar la ficha.
 *
 * Las imágenes se administran aparte, en el paso 27.
 */
export function PropertyForm({
  features,
  property,
}: {
  readonly features: readonly PropertyFeatureDto[];
  /** Ausente al crear. Presente al editar. */
  readonly property?: AdminPropertyDto;
}) {
  const fieldId = useId();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Los mismos valores iniciales alimentan al formulario y a los atributos
   * `defaultValue` de cada campo.
   *
   * React Hook Form los asigna al hidratar, así que sin los atributos el
   * servidor pintaría una ficha de edición en blanco y los datos aparecerían
   * un instante después. Con ellos, lo que llega ya viene relleno.
   */
  const defaults = toDefaultValues(property);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: defaults,
  });

  async function onSubmit(values: PropertyFormValues) {
    setErrorMessage(null);

    const input = toPropertyInput(values);

    try {
      if (property) {
        await updateAdminProperty(property.id, input);
      } else {
        await createAdminProperty(input);
      }

      router.push("/admin/properties");
      // El listado lo pinta el servidor: sin esto mostraría lo de antes.
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No pudimos guardar la propiedad.",
      );
    }
  }

  const field = (name: keyof PropertyFormValues) => ({
    id: `${fieldId}-${name}`,
    error: errors[name]?.message,
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-8"
    >
      <Section title="Descripción">
        <FormField {...field("title")} label="Título">
          <TextInput
            id={`${fieldId}-title`}
            defaultValue={defaults.title}
            hasError={Boolean(errors.title)}
            registration={register("title")}
          />
        </FormField>

        <FormField {...field("description")} label="Descripción">
          <textarea
            id={`${fieldId}-description`}
            rows={6}
            defaultValue={defaults.description}
            className={fieldInputClassName(Boolean(errors.description))}
            {...fieldErrorAttributes(
              `${fieldId}-description`,
              Boolean(errors.description),
            )}
            {...register("description")}
          />
        </FormField>
      </Section>

      <Section title="Operación y precio">
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField {...field("operationType")} label="Operación">
            <select
              id={`${fieldId}-operationType`}
              defaultValue={defaults.operationType}
              className={fieldInputClassName(Boolean(errors.operationType))}
              {...fieldErrorAttributes(
                `${fieldId}-operationType`,
                Boolean(errors.operationType),
              )}
              {...register("operationType")}
            >
              {Object.values(OperationType).map((operation) => (
                <option key={operation} value={operation}>
                  {formatOperationType(operation)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField {...field("propertyType")} label="Tipo">
            <select
              id={`${fieldId}-propertyType`}
              defaultValue={defaults.propertyType}
              className={fieldInputClassName(Boolean(errors.propertyType))}
              {...fieldErrorAttributes(
                `${fieldId}-propertyType`,
                Boolean(errors.propertyType),
              )}
              {...register("propertyType")}
            >
              {Object.values(PropertyType).map((type) => (
                <option key={type} value={type}>
                  {formatPropertyType(type)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            {...field("price")}
            label="Precio"
            hint="USD · en arriendo, mensual"
          >
            <NumberInput
              id={`${fieldId}-price`}
              defaultValue={defaults.price}
              step="0.01"
              hasError={Boolean(errors.price)}
              registration={register("price")}
            />
          </FormField>
        </div>
      </Section>

      <Section
        title="Superficies y ambientes"
        description="Deja en blanco lo que la propiedad no declare: un terreno no tiene dormitorios, y eso es un dato, no un olvido."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            {...field("usableAreaSquareMeters")}
            label="Superficie útil"
            hint="m²"
          >
            <NumberInput
              id={`${fieldId}-usableAreaSquareMeters`}
              defaultValue={defaults.usableAreaSquareMeters}
              step="0.01"
              hasError={Boolean(errors.usableAreaSquareMeters)}
              registration={register("usableAreaSquareMeters")}
            />
          </FormField>

          <FormField
            {...field("totalAreaSquareMeters")}
            label="Superficie total"
            hint="m²"
          >
            <NumberInput
              id={`${fieldId}-totalAreaSquareMeters`}
              defaultValue={defaults.totalAreaSquareMeters}
              step="0.01"
              hasError={Boolean(errors.totalAreaSquareMeters)}
              registration={register("totalAreaSquareMeters")}
            />
          </FormField>

          <FormField {...field("bedrooms")} label="Dormitorios">
            <NumberInput
              id={`${fieldId}-bedrooms`}
              defaultValue={defaults.bedrooms}
              step="1"
              hasError={Boolean(errors.bedrooms)}
              registration={register("bedrooms")}
            />
          </FormField>

          <FormField {...field("bathrooms")} label="Baños">
            <NumberInput
              id={`${fieldId}-bathrooms`}
              defaultValue={defaults.bathrooms}
              step="1"
              hasError={Boolean(errors.bathrooms)}
              registration={register("bathrooms")}
            />
          </FormField>

          <FormField {...field("parkingSpaces")} label="Estacionamientos">
            <NumberInput
              id={`${fieldId}-parkingSpaces`}
              defaultValue={defaults.parkingSpaces}
              step="1"
              hasError={Boolean(errors.parkingSpaces)}
              registration={register("parkingSpaces")}
            />
          </FormField>

          <FormField
            {...field("ageYears")}
            label="Antigüedad"
            hint="años · 0 es nueva"
          >
            <NumberInput
              id={`${fieldId}-ageYears`}
              defaultValue={defaults.ageYears}
              step="1"
              hasError={Boolean(errors.ageYears)}
              registration={register("ageYears")}
            />
          </FormField>
        </div>
      </Section>

      <Section
        title="Ubicación"
        description="La dirección basta: las coordenadas del mapa las deduce el servidor a partir de ella."
      >
        <FormField {...field("address")} label="Dirección">
          <TextInput
            id={`${fieldId}-address`}
            defaultValue={defaults.address}
            hasError={Boolean(errors.address)}
            registration={register("address")}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField {...field("commune")} label="Comuna">
            <TextInput
              id={`${fieldId}-commune`}
              defaultValue={defaults.commune}
              hasError={Boolean(errors.commune)}
              registration={register("commune")}
            />
          </FormField>

          <FormField {...field("city")} label="Ciudad">
            <TextInput
              id={`${fieldId}-city`}
              defaultValue={defaults.city}
              hasError={Boolean(errors.city)}
              registration={register("city")}
            />
          </FormField>

          <FormField {...field("region")} label="Región">
            <TextInput
              id={`${fieldId}-region`}
              defaultValue={defaults.region}
              hasError={Boolean(errors.region)}
              registration={register("region")}
            />
          </FormField>
        </div>
      </Section>

      <FeatureChoices
        features={features}
        selectedSlugs={defaults.featureSlugs}
        registration={register("featureSlugs")}
      />

      <Section title="Publicación">
        <Checkbox
          id={`${fieldId}-isPublished`}
          label="Publicada"
          isChecked={defaults.isPublished}
          description="Sin esto la propiedad no aparece en el portal. Una propiedad nueva nace despublicada."
          registration={register("isPublished")}
        />

        <Checkbox
          id={`${fieldId}-isFeatured`}
          label="Destacada"
          isChecked={defaults.isFeatured}
          description="Las destacadas encabezan la portada."
          registration={register("isFeatured")}
        />
      </Section>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong disabled:cursor-progress disabled:opacity-70"
        >
          {isSubmitting
            ? "Guardando…"
            : property
              ? "Guardar cambios"
              : "Crear propiedad"}
        </button>

        <Link
          href="/admin/properties"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-muted"
        >
          Cancelar
        </Link>

        <p aria-live="polite" className="text-sm text-danger">
          {errorMessage}
        </p>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="text-base font-semibold tracking-tight text-ink">
        {title}
      </legend>

      {description ? (
        <p className="-mt-2 text-sm text-ink-muted">{description}</p>
      ) : null}

      {children}
    </fieldset>
  );
}

/**
 * Campo de texto.
 *
 * Sin autocompletado: los datos son de la propiedad, no de quien los
 * escribe. Con él, el navegador ofrecería la dirección y la ciudad de la
 * persona que administra, que es justo lo que no va en esta ficha.
 */
function TextInput({
  id,
  defaultValue,
  hasError,
  registration,
}: {
  readonly id: string;
  readonly defaultValue: string;
  readonly hasError: boolean;
  readonly registration: UseFormRegisterReturn;
}) {
  return (
    <input
      id={id}
      type="text"
      defaultValue={defaultValue}
      autoComplete="off"
      className={fieldInputClassName(hasError)}
      {...fieldErrorAttributes(id, hasError)}
      {...registration}
    />
  );
}

/**
 * Campo numérico.
 *
 * `type="number"` da el teclado adecuado en móvil y las flechas en
 * escritorio, pero su valor sigue llegando como texto: la conversión y el
 * significado del vacío viven en el esquema.
 */
function NumberInput({
  id,
  defaultValue,
  step,
  hasError,
  registration,
}: {
  readonly id: string;
  readonly defaultValue: string;
  readonly step: string;
  readonly hasError: boolean;
  readonly registration: UseFormRegisterReturn;
}) {
  return (
    <input
      id={id}
      type="number"
      defaultValue={defaultValue}
      autoComplete="off"
      inputMode="decimal"
      min="0"
      step={step}
      className={fieldInputClassName(hasError)}
      {...fieldErrorAttributes(id, hasError)}
      {...registration}
    />
  );
}

/**
 * Características de la propiedad.
 *
 * Son casillas y no un campo de texto porque el backend las conecta por
 * `slug` contra la tabla `features`: una escrita a mano no existiría.
 */
function FeatureChoices({
  features,
  selectedSlugs,
  registration,
}: {
  readonly features: readonly PropertyFeatureDto[];
  readonly selectedSlugs: readonly string[];
  readonly registration: UseFormRegisterReturn;
}) {
  return (
    <Section title="Características">
      {features.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-muted px-5 py-6 text-center text-sm text-ink-muted">
          Todavía no hay características registradas.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li key={feature.id}>
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-line px-3 text-sm text-ink transition-colors hover:bg-muted">
                <input
                  type="checkbox"
                  value={feature.slug}
                  defaultChecked={selectedSlugs.includes(feature.slug)}
                  className="size-4 accent-accent"
                  {...registration}
                />
                {feature.name}
              </label>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function Checkbox({
  id,
  label,
  description,
  isChecked,
  registration,
}: {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly isChecked: boolean;
  readonly registration: UseFormRegisterReturn;
}) {
  return (
    <div className="flex gap-3">
      <input
        id={id}
        type="checkbox"
        defaultChecked={isChecked}
        className="mt-1 size-4 accent-accent"
        {...registration}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
    </div>
  );
}

/**
 * Valores iniciales.
 *
 * Un número ausente se pinta como campo vacío, no como cero: la ficha no
 * debe inventar que la propiedad tiene cero baños.
 */
function toDefaultValues(property?: AdminPropertyDto): PropertyFormValues {
  return {
    title: property?.title ?? "",
    description: property?.description ?? "",
    operationType: property?.operationType ?? OperationType.SALE,
    propertyType: property?.propertyType ?? PropertyType.HOUSE,
    price: toFieldValue(property?.price),
    usableAreaSquareMeters: toFieldValue(property?.usableAreaSquareMeters),
    totalAreaSquareMeters: toFieldValue(property?.totalAreaSquareMeters),
    bedrooms: toFieldValue(property?.bedrooms),
    bathrooms: toFieldValue(property?.bathrooms),
    parkingSpaces: toFieldValue(property?.parkingSpaces),
    ageYears: toFieldValue(property?.ageYears),
    address: property?.address ?? "",
    commune: property?.commune ?? "",
    city: property?.city ?? "",
    region: property?.region ?? "",
    featureSlugs: property?.features.map((feature) => feature.slug) ?? [],
    isPublished: property?.isPublished ?? false,
    isFeatured: property?.isFeatured ?? false,
  };
}

function toFieldValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}
