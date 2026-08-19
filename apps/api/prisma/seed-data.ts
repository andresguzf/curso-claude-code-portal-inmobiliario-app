/**
 * Datos de desarrollo para el Portal Inmobiliario.
 *
 * Los identificadores son fijos y legibles para que el seed sea idempotente:
 * volver a ejecutarlo actualiza las mismas filas en lugar de duplicarlas.
 *
 * Los precios están en USD (spec.md, sección 3). En operaciones de arriendo
 * representan el valor mensual.
 */

export type SeedFeature = {
  readonly slug: string;
  readonly name: string;
};

export type SeedProperty = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly operationType: "SALE" | "RENT";
  readonly propertyType:
    "HOUSE" | "APARTMENT" | "LAND" | "OFFICE" | "COMMERCIAL" | "OTHER";
  readonly price: string;
  readonly usableAreaSquareMeters: string | null;
  readonly totalAreaSquareMeters: string | null;
  readonly bedrooms: number | null;
  readonly bathrooms: number | null;
  readonly parkingSpaces: number | null;
  readonly ageYears: number | null;
  readonly address: string;
  readonly commune: string;
  readonly city: string;
  readonly region: string;
  readonly isPublished: boolean;
  readonly isFeatured: boolean;
  readonly featureSlugs: readonly string[];
  readonly imageCount: number;
};

/** Características del inmueble (spec.md, sección 4). */
/**
 * Cuentas de desarrollo.
 *
 * Las contraseñas están en claro porque este archivo solo alimenta la base de
 * datos local: el seed las convierte en hash antes de guardarlas y en
 * PostgreSQL nunca aparece el texto. No deben usarse fuera de desarrollo.
 *
 * El registro público solo crea cuentas `USER`, así que la de administración
 * tiene que llegar por aquí. Se incluye además una cuenta desactivada, para
 * poder comprobar que un usuario inactivo no puede autenticarse (plan.md,
 * sección 10).
 *
 * La contraseña de cada cuenta es su nombre seguido de dígitos hasta llegar
 * al mínimo que exige el backend. Son fáciles de recordar al probar y a nadie
 * se le ocurrirá confundirlas con contraseñas de verdad.
 */
export type SeedUser = {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role: "ADMIN" | "USER";
  readonly isActive: boolean;
};

export const SEED_USERS: readonly SeedUser[] = [
  {
    name: "Administradora del portal",
    email: "admin@portal.cl",
    password: "admin1234",
    role: "ADMIN",
    isActive: true,
  },
  {
    name: "María González",
    email: "maria@example.com",
    password: "maria1234",
    role: "USER",
    isActive: true,
  },
  {
    name: "Pedro Rojas",
    email: "pedro@example.com",
    password: "pedro1234",
    role: "USER",
    isActive: false,
  },
  {
    name: "Ana Pérez",
    email: "ana@example.com",
    password: "ana12345",
    role: "USER",
    isActive: true,
  },
  {
    name: "Bruno Soto",
    email: "bruno@example.com",
    password: "bruno1234",
    role: "USER",
    isActive: true,
  },
];

export const SEED_FEATURES: readonly SeedFeature[] = [
  { slug: "piscina", name: "Piscina" },
  { slug: "gimnasio", name: "Gimnasio" },
  { slug: "quincho", name: "Quincho" },
  { slug: "lavanderia", name: "Lavandería" },
  { slug: "jardin", name: "Jardín" },
  { slug: "terraza", name: "Terraza" },
  { slug: "bodega", name: "Bodega" },
  { slug: "ascensor", name: "Ascensor" },
  { slug: "conserjeria", name: "Conserjería" },
  { slug: "seguridad", name: "Seguridad" },
  { slug: "calefaccion", name: "Calefacción" },
  { slug: "aire-acondicionado", name: "Aire acondicionado" },
  { slug: "pet-friendly", name: "Pet friendly" },
];

export const SEED_PROPERTIES: readonly SeedProperty[] = [
  // --- Venta ---------------------------------------------------------------
  {
    id: "seed-property-01",
    title: "Casa familiar con piscina en Las Condes",
    description:
      "Amplia casa en barrio residencial consolidado, a pasos de colegios y del Parque Araucano. Living comedor con doble altura, cocina equipada con isla y logia independiente. El dormitorio principal cuenta con vestidor y baño en suite. El patio posterior tiene piscina, quincho techado y jardín mantenido.",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: "890000.00",
    usableAreaSquareMeters: "180.00",
    totalAreaSquareMeters: "420.00",
    bedrooms: 4,
    bathrooms: 3,
    parkingSpaces: 2,
    ageYears: 12,
    address: "Avenida Presidente Riesco 4520",
    commune: "Las Condes",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: true,
    isFeatured: true,
    featureSlugs: ["piscina", "quincho", "jardin", "seguridad", "calefaccion"],
    imageCount: 4,
  },
  {
    id: "seed-property-02",
    title: "Departamento luminoso frente a Parque Bustamante",
    description:
      "Departamento de dos dormitorios con orientación nororiente y vista despejada al parque. Edificio con conserjería 24 horas, gimnasio y sala multiuso. Excelente conectividad: dos cuadras del Metro Santa Isabel y del eje Providencia.",
    operationType: "SALE",
    propertyType: "APARTMENT",
    price: "285000.00",
    usableAreaSquareMeters: "78.00",
    totalAreaSquareMeters: "92.00",
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 1,
    ageYears: 5,
    address: "Avenida Manuel Montt 180",
    commune: "Providencia",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: true,
    isFeatured: false,
    featureSlugs: ["ascensor", "conserjeria", "gimnasio", "bodega"],
    imageCount: 3,
  },
  {
    id: "seed-property-03",
    title: "Departamento premium con terraza en Vitacura",
    description:
      "Unidad de tres dormitorios en suite en edificio boutique de baja densidad. Terraza de 25 m² con parrilla incorporada y vista a la cordillera. Espacios comunes con piscina temperada, gimnasio equipado y sala de reuniones.",
    operationType: "SALE",
    propertyType: "APARTMENT",
    price: "640000.00",
    usableAreaSquareMeters: "145.00",
    totalAreaSquareMeters: "168.00",
    bedrooms: 3,
    bathrooms: 3,
    parkingSpaces: 2,
    ageYears: 3,
    address: "Avenida Alonso de Córdova 3800",
    commune: "Vitacura",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: true,
    isFeatured: true,
    featureSlugs: [
      "piscina",
      "gimnasio",
      "conserjeria",
      "ascensor",
      "terraza",
      "seguridad",
    ],
    imageCount: 4,
  },
  {
    id: "seed-property-04",
    title: "Terreno con vista al lago en Puerto Varas",
    description:
      "Paño de 5.000 m² con acceso pavimentado y factibilidad de agua y electricidad. Pendiente suave y vista despejada al lago Llanquihue y al volcán Osorno. Ideal para proyecto residencial o casa de descanso.",
    operationType: "SALE",
    propertyType: "LAND",
    price: "145000.00",
    usableAreaSquareMeters: null,
    totalAreaSquareMeters: "5000.00",
    bedrooms: null,
    bathrooms: null,
    parkingSpaces: null,
    ageYears: null,
    address: "Camino a Ensenada kilómetro 8",
    commune: "Puerto Varas",
    city: "Puerto Varas",
    region: "Región de Los Lagos",
    isPublished: true,
    isFeatured: false,
    featureSlugs: [],
    imageCount: 2,
  },
  {
    id: "seed-property-05",
    title: "Oficina habilitada en el centro cívico",
    description:
      "Oficina en piso alto con planta libre, sala de reuniones y kitchenette. Edificio con recepción, control de acceso y estacionamiento de visitas. A una cuadra del Metro Universidad de Chile.",
    operationType: "SALE",
    propertyType: "OFFICE",
    price: "210000.00",
    usableAreaSquareMeters: "120.00",
    totalAreaSquareMeters: "135.00",
    bedrooms: null,
    bathrooms: 2,
    parkingSpaces: 2,
    ageYears: 18,
    address: "Agustinas 1120",
    commune: "Santiago",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: true,
    isFeatured: false,
    featureSlugs: [
      "ascensor",
      "seguridad",
      "aire-acondicionado",
      "conserjeria",
    ],
    imageCount: 3,
  },
  {
    id: "seed-property-06",
    title: "Casa mediterránea a tres cuadras de la playa",
    description:
      "Casa de dos pisos en calle tranquila del sector Jardín del Mar. Living con chimenea, comedor independiente y cocina con despensa. Patio con piscina, quincho y jardín con árboles maduros.",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: "520000.00",
    usableAreaSquareMeters: "240.00",
    totalAreaSquareMeters: "600.00",
    bedrooms: 5,
    bathrooms: 4,
    parkingSpaces: 3,
    ageYears: 20,
    address: "Calle Bosque de Montemar 145",
    commune: "Viña del Mar",
    city: "Viña del Mar",
    region: "Región de Valparaíso",
    isPublished: true,
    isFeatured: false,
    featureSlugs: ["piscina", "quincho", "jardin", "bodega", "terraza"],
    imageCount: 4,
  },
  {
    id: "seed-property-07",
    title: "Local comercial en eje Irarrázaval",
    description:
      "Local a la calle con vitrina continua, baño y bodega interior. Alto flujo peatonal y paradero de transporte público en la vereda. Actualmente habilitado como cafetería.",
    operationType: "SALE",
    propertyType: "COMMERCIAL",
    price: "175000.00",
    usableAreaSquareMeters: "95.00",
    totalAreaSquareMeters: "95.00",
    bedrooms: null,
    bathrooms: 1,
    parkingSpaces: 1,
    ageYears: 25,
    address: "Avenida Irarrázaval 3450",
    commune: "Ñuñoa",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: false,
    isFeatured: false,
    featureSlugs: ["seguridad"],
    imageCount: 2,
  },

  // --- Arriendo ------------------------------------------------------------
  {
    id: "seed-property-08",
    title: "Departamento acogedor en Plaza Ñuñoa",
    description:
      "Dos dormitorios a pasos de Plaza Ñuñoa, con comercio, restaurantes y áreas verdes en el entorno inmediato. Edificio con conserjería, lavandería compartida y bicicletero. Se aceptan mascotas.",
    operationType: "RENT",
    propertyType: "APARTMENT",
    price: "950.00",
    usableAreaSquareMeters: "62.00",
    totalAreaSquareMeters: "70.00",
    bedrooms: 2,
    bathrooms: 1,
    parkingSpaces: 1,
    ageYears: 8,
    address: "Calle Jorge Washington 220",
    commune: "Ñuñoa",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: true,
    isFeatured: false,
    featureSlugs: ["ascensor", "conserjeria", "lavanderia", "pet-friendly"],
    imageCount: 3,
  },
  {
    id: "seed-property-09",
    title: "Departamento nuevo con piscina en El Golf",
    description:
      "Tres dormitorios en edificio recién entregado, a dos cuadras del Metro El Golf. Cocina integrada con artefactos incluidos y ventanas termopanel. Áreas comunes con piscina, gimnasio y quinchos.",
    operationType: "RENT",
    propertyType: "APARTMENT",
    price: "1800.00",
    usableAreaSquareMeters: "110.00",
    totalAreaSquareMeters: "125.00",
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 2,
    ageYears: 2,
    address: "Calle Augusto Leguía Norte 140",
    commune: "Las Condes",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: true,
    isFeatured: true,
    featureSlugs: [
      "piscina",
      "gimnasio",
      "conserjeria",
      "ascensor",
      "bodega",
      "seguridad",
    ],
    imageCount: 4,
  },
  {
    id: "seed-property-10",
    title: "Casa con jardín en La Reina alta",
    description:
      "Casa de un piso en condominio cerrado con acceso controlado. Living comedor con salida a terraza, cocina amplia y sala de estar independiente. Jardín con quincho y espacio para huerto. Apta para mascotas.",
    operationType: "RENT",
    propertyType: "HOUSE",
    price: "2400.00",
    usableAreaSquareMeters: "200.00",
    totalAreaSquareMeters: "450.00",
    bedrooms: 4,
    bathrooms: 3,
    parkingSpaces: 2,
    ageYears: 15,
    address: "Avenida Larraín 9200",
    commune: "La Reina",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: true,
    isFeatured: false,
    featureSlugs: [
      "jardin",
      "quincho",
      "calefaccion",
      "pet-friendly",
      "bodega",
    ],
    imageCount: 3,
  },
  {
    id: "seed-property-11",
    title: "Oficina equipada en Nueva Providencia",
    description:
      "Oficina con cuatro puestos de trabajo, sala de reuniones vidriada y recepción. Incluye climatización, cableado estructurado y dos estacionamientos. Edificio con acceso controlado las 24 horas.",
    operationType: "RENT",
    propertyType: "OFFICE",
    price: "1500.00",
    usableAreaSquareMeters: "85.00",
    totalAreaSquareMeters: "95.00",
    bedrooms: null,
    bathrooms: 2,
    parkingSpaces: 2,
    ageYears: 10,
    address: "Avenida Nueva Providencia 2250",
    commune: "Providencia",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: true,
    isFeatured: false,
    featureSlugs: [
      "ascensor",
      "aire-acondicionado",
      "seguridad",
      "conserjeria",
    ],
    imageCount: 3,
  },
  {
    id: "seed-property-12",
    title: "Estudio con vista al mar en Concón",
    description:
      "Estudio amoblado con terraza y vista directa al océano. Ideal para temporada o estadías prolongadas. Edificio con ascensor y estacionamiento asignado.",
    operationType: "RENT",
    propertyType: "APARTMENT",
    price: "780.00",
    usableAreaSquareMeters: "45.00",
    totalAreaSquareMeters: "52.00",
    bedrooms: 1,
    bathrooms: 1,
    parkingSpaces: 1,
    ageYears: 10,
    address: "Avenida Borgoño 25400",
    commune: "Concón",
    city: "Viña del Mar",
    region: "Región de Valparaíso",
    isPublished: false,
    isFeatured: false,
    featureSlugs: ["terraza", "ascensor"],
    imageCount: 2,
  },
];

/**
 * Imágenes de marcador de posición para desarrollo.
 *
 * En producción las imágenes viven en Cloudinary (spec.md, sección 5). El
 * seed conserva la misma forma de datos —URL más `publicId`— para que la
 * aplicación no distinga entre datos de desarrollo y datos reales.
 */
export function buildSeedImages(property: SeedProperty) {
  return Array.from({ length: property.imageCount }, (_, index) => ({
    publicId: `seed/properties/${property.id}/${index + 1}`,
    url: `https://picsum.photos/seed/${property.id}-${index + 1}/1200/800`,
    position: index,
    isPrimary: index === 0,
  }));
}
