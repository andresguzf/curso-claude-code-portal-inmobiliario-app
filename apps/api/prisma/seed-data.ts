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

export type SeedImage = {
  readonly url: string;
  readonly publicId: string;
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
} & SeedGallery;

/**
 * De dónde salen las imágenes de una propiedad: o se declaran, o se generan.
 *
 * Es una unión y no dos campos opcionales para que no puedan contradecirse.
 * Con `imageCount: 4` junto a una lista de seis, ¿cuántas hay? Ese desacuerdo
 * llegó a existir, y lo cazó una prueba en vez del compilador.
 */
export type SeedGallery =
  /**
   * Imágenes concretas, cuando la propiedad ya las tiene subidas.
   *
   * Sin esto, una propiedad con fotografías reales volvería del seed con
   * marcadores de posición. Declararlas no sube nada a Cloudinary: apunta a
   * archivos que ya están allí.
   */
  | { readonly images: readonly SeedImage[]; readonly imageCount?: never }
  /** Cuántos marcadores generar, para las que aún no tienen fotografías. */
  | { readonly imageCount: number; readonly images?: never };

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
    name: "Maria",
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
  // Las cuatro siguientes se dieron de alta desde el portal y desde el panel,
  // no estaban en el conjunto original. Sus contraseñas no se pueden
  // recuperar —solo se guarda el hash—, así que se les asigna una siguiendo
  // la misma convención: el nombre seguido de dígitos hasta ocho caracteres.
  {
    name: "Andres",
    email: "andres@example.com",
    password: "andres1234",
    role: "USER",
    isActive: true,
  },
  {
    name: "Bruno Andrés Soto",
    email: "bruno.soto@example.com",
    password: "soto1234",
    role: "USER",
    isActive: true,
  },
  {
    name: "Rosita Doe",
    email: "rosita.doe@example.com",
    password: "rosita1234",
    role: "USER",
    isActive: true,
  },
  {
    name: "Alejandra Roe",
    email: "ale.roe@example.com",
    password: "alejandra1234",
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
  // El identificador no es «tinaja» a propósito: se creó como «Hot tub» y se
  // renombró después. El slug no cambia al renombrar, porque es con lo que
  // las propiedades quedan enlazadas (spec.md, sección 4).
  { slug: "hottub", name: "Tinaja" },
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
    images: [
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587231/propiedades-claude/t94pyxmnkgsysovhgoic.jpg",
        publicId: "propiedades-claude/t94pyxmnkgsysovhgoic",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587234/propiedades-claude/elq9gtxr1avhb8br8s5a.jpg",
        publicId: "propiedades-claude/elq9gtxr1avhb8br8s5a",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587237/propiedades-claude/t2p4srb7m6fw3lwejlex.jpg",
        publicId: "propiedades-claude/t2p4srb7m6fw3lwejlex",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587241/propiedades-claude/kbaryz8t66ego7joyg8u.jpg",
        publicId: "propiedades-claude/kbaryz8t66ego7joyg8u",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587245/propiedades-claude/hlh7qihtfusoulihwhd4.jpg",
        publicId: "propiedades-claude/hlh7qihtfusoulihwhd4",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587249/propiedades-claude/p6y6jaa3ofnacr0eptag.jpg",
        publicId: "propiedades-claude/p6y6jaa3ofnacr0eptag",
      },
    ],
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
    images: [
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587153/propiedades-claude/coy2dbwyxwst9f6t35fk.jpg",
        publicId: "propiedades-claude/coy2dbwyxwst9f6t35fk",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587155/propiedades-claude/tvydndg1sealjxwanihx.jpg",
        publicId: "propiedades-claude/tvydndg1sealjxwanihx",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587159/propiedades-claude/eigle8hfgmayoulzviyt.jpg",
        publicId: "propiedades-claude/eigle8hfgmayoulzviyt",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587162/propiedades-claude/xstipmihc7xrpekusf3m.jpg",
        publicId: "propiedades-claude/xstipmihc7xrpekusf3m",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587166/propiedades-claude/vkta9rdu4jl0k7euydif.jpg",
        publicId: "propiedades-claude/vkta9rdu4jl0k7euydif",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587169/propiedades-claude/flkpbivp9juk4jnlwpjq.jpg",
        publicId: "propiedades-claude/flkpbivp9juk4jnlwpjq",
      },
    ],
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
    images: [
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787617569/propiedades-claude/q0ndnqoopqtsokzpd1cb.png",
        publicId: "propiedades-claude/q0ndnqoopqtsokzpd1cb",
      },
    ],
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
    isPublished: true,
    isFeatured: false,
    featureSlugs: ["terraza", "ascensor"],
    images: [
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587046/propiedades-claude/tddcu0t2hx0umurh0ebg.png",
        publicId: "propiedades-claude/tddcu0t2hx0umurh0ebg",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587043/propiedades-claude/nxcyyzfqnkrg0xdyeqnh.png",
        publicId: "propiedades-claude/nxcyyzfqnkrg0xdyeqnh",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787587040/propiedades-claude/ikdjftmz2g5h3xhieoyf.png",
        publicId: "propiedades-claude/ikdjftmz2g5h3xhieoyf",
      },
    ],
  },
  {
    // Creada desde el panel de administración, no escrita a mano como las
    // doce anteriores. Conserva su identificador original para que las
    // consultas y los favoritos que la referencian sigan encontrándola.
    id: "cmt269lfo000crwzqdy9iu2zt",
    title: "Casa de Montaña con Vistas Panorámicas a la Cordillera",
    description:
      "Espectacular propiedad de montaña de arquitectura contemporánea alpina, emplazada en un terreno privilegiado con imponentes vistas despejadas a las altas cumbres de la Cordillera de los Andes.\n\nDiseñada para fundirse con la naturaleza mediante el uso de materiales nobles locales como piedra volcánica, vigas a la vista y madera tratada termocontrolada (yakisugi / shou sugi ban).\n\nÁrea Social\nImpresionante living comedor con doble altura, amplios ventanales termopanel de piso a cielo y una chimenea central suspendida de acero negro con fogata abierta.\n\nCocina Integrada\nCocina de concepto abierto con isla de cuarzo negro, encimera de inducción y muebles de roble a medida.\n\nMaster Suite\nDormitorio principal con terraza privada panorámica, chimenea rústica, walk-in closet y baño con tina exenta con vista a los picos nevados.\n\nExteriores y Relax\nGran terraza voladiza de madera con zona de fire pit (fogón integrado), hot tub exterior climatizado y quincho protegido contra el viento.\n\nEficiencia y Confort\nSistema de calefacción central por losa radiante con aerotermia, cristales de control solar de alta eficiencia térmica y aislamiento perimetral premium para todas las estaciones del año.",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: "850000.00",
    usableAreaSquareMeters: "340.00",
    totalAreaSquareMeters: "3200.00",
    bedrooms: 4,
    bathrooms: 4,
    parkingSpaces: 2,
    // Cero años es «a estrenar», que es distinto de no declarar antigüedad.
    ageYears: 0,
    address: "Camino a Farellones",
    commune: "Lo Barnechea",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: true,
    isFeatured: false,
    featureSlugs: [
      "piscina",
      "quincho",
      "jardin",
      "terraza",
      "bodega",
      "seguridad",
      "calefaccion",
      "pet-friendly",
      "hottub",
    ],
    images: [
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787269779/propiedades-claude/gmum47rfmgsyrypeiutx.jpg",
        publicId: "propiedades-claude/gmum47rfmgsyrypeiutx",
      },
      {
        url: "https://res.cloudinary.com/db1rqce7l/image/upload/v1787269781/propiedades-claude/w6nn5ra7bbuxsyrqdmgb.png",
        publicId: "propiedades-claude/w6nn5ra7bbuxsyrqdmgb",
      },
    ],
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
  if (property.images) {
    return property.images.map((image, index) => ({
      publicId: image.publicId,
      url: image.url,
      position: index,
      isPrimary: index === 0,
    }));
  }

  return Array.from({ length: property.imageCount ?? 0 }, (_, index) => ({
    publicId: `seed/properties/${property.id}/${index + 1}`,
    url: `https://picsum.photos/seed/${property.id}-${index + 1}/1200/800`,
    position: index,
    isPrimary: index === 0,
  }));
}
