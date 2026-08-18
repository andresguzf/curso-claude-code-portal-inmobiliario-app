import { describe, expect, it } from "vitest";

import {
  buildPropertyOrderBy,
  buildPropertyWhere,
  normalizeLocationValue,
  parsePropertyListQuery,
} from "./property-query";

function parse(queryString: string) {
  return parsePropertyListQuery(new URLSearchParams(queryString));
}

function expectQuery(queryString: string) {
  const result = parse(queryString);

  if (!result.ok) {
    throw new Error(`Se esperaba una consulta válida: ${result.message}`);
  }

  return result.query;
}

function expectError(queryString: string) {
  const result = parse(queryString);

  if (result.ok) {
    throw new Error("Se esperaba un error de validación");
  }

  return result.message;
}

describe("parsePropertyListQuery — sin filtros", () => {
  it("acepta una URL sin parámetros", () => {
    expect(expectQuery("")).toEqual({});
  });

  it("ignora los parámetros presentes pero vacíos", () => {
    expect(
      expectQuery("operation=&type=&minPrice=&bedrooms=&commune=&region="),
    ).toEqual({});
  });

  it("descarta parámetros desconocidos", () => {
    expect(expectQuery("colorFavorito=azul")).toEqual({});
  });
});

describe("parsePropertyListQuery — operación múltiple", () => {
  it("acepta una operación", () => {
    expect(expectQuery("operation=SALE").operations).toEqual(["SALE"]);
    expect(expectQuery("operation=RENT").operations).toEqual(["RENT"]);
  });

  it("acepta ambas operaciones repitiendo el parámetro", () => {
    expect(expectQuery("operation=SALE&operation=RENT").operations).toEqual([
      "SALE",
      "RENT",
    ]);
  });

  it("descarta duplicados", () => {
    expect(expectQuery("operation=SALE&operation=SALE").operations).toEqual([
      "SALE",
    ]);
  });

  it("rechaza una operación inválida en lugar de ignorarla", () => {
    expect(expectError("operation=REGALO")).toMatch(/SALE o RENT/);
    expect(expectError("operation=SALE&operation=REGALO")).toMatch(
      /SALE o RENT/,
    );
  });

  it("distingue mayúsculas en el valor de la enumeración", () => {
    expect(expectError("operation=sale")).toMatch(/SALE o RENT/);
  });
});

describe("parsePropertyListQuery — tipo múltiple", () => {
  it("acepta los seis tipos de propiedad", () => {
    for (const propertyType of [
      "HOUSE",
      "APARTMENT",
      "LAND",
      "OFFICE",
      "COMMERCIAL",
      "OTHER",
    ]) {
      expect(expectQuery(`type=${propertyType}`).types).toEqual([propertyType]);
    }
  });

  it("combina varios tipos («casa o departamento»)", () => {
    expect(expectQuery("type=HOUSE&type=APARTMENT").types).toEqual([
      "HOUSE",
      "APARTMENT",
    ]);
  });

  it("rechaza un tipo de propiedad inválido", () => {
    expect(expectError("type=CASTILLO")).toMatch(/HOUSE/);
  });
});

describe("parsePropertyListQuery — filtros numéricos", () => {
  it("acepta precios y superficies", () => {
    const query = expectQuery(
      "minPrice=100000&maxPrice=500000&minUsableArea=80",
    );

    expect(query.minPrice).toBe(100000);
    expect(query.maxPrice).toBe(500000);
    expect(query.minUsableArea).toBe(80);
  });

  it("acepta dormitorios y baños", () => {
    const query = expectQuery("bedrooms=3&bathrooms=2");

    expect(query.bedrooms).toBe(3);
    expect(query.bathrooms).toBe(2);
  });

  it("rechaza valores no numéricos", () => {
    expect(expectError("minPrice=barato")).toMatch(/debe ser un número/);
    expect(expectError("bedrooms=muchos")).toMatch(/debe ser un número/);
  });

  it("rechaza valores negativos", () => {
    expect(expectError("minPrice=-1")).toMatch(/no puede ser negativo/);
    expect(expectError("bedrooms=-2")).toMatch(/no puede ser negativo/);
  });

  it("exige enteros en dormitorios y baños", () => {
    expect(expectError("bedrooms=2.5")).toMatch(/número entero/);
    expect(expectError("bathrooms=1.5")).toMatch(/número entero/);
  });

  it("admite decimales en precio y superficie", () => {
    expect(expectQuery("minPrice=1500.50").minPrice).toBe(1500.5);
    expect(expectQuery("minUsableArea=62.5").minUsableArea).toBe(62.5);
  });

  it("acota los valores al rango que admite PostgreSQL", () => {
    expect(expectError("minPrice=99999999999")).toMatch(/no puede superar/);
    expect(expectError("bedrooms=99")).toMatch(/no puede superar/);
    expect(expectError("minUsableArea=99999999")).toMatch(/no puede superar/);
  });

  it("rechaza un rango de precio invertido", () => {
    expect(expectError("minPrice=500000&maxPrice=100000")).toMatch(
      /precio mínimo no puede ser mayor/,
    );
  });

  it("acepta un rango con extremos iguales", () => {
    const query = expectQuery("minPrice=100000&maxPrice=100000");

    expect(query.minPrice).toBe(100000);
    expect(query.maxPrice).toBe(100000);
  });
});

describe("parsePropertyListQuery — búsqueda y ubicación", () => {
  it("conserva la búsqueda textual", () => {
    expect(expectQuery("search=providencia").search).toBe("providencia");
  });

  it("rechaza una búsqueda demasiado larga", () => {
    expect(expectError(`search=${"a".repeat(121)}`)).toMatch(/120 caracteres/);
  });

  it("acepta varias comunas", () => {
    expect(
      expectQuery("commune=Las+Condes&commune=Providencia").communes,
    ).toEqual(["Las Condes", "Providencia"]);
  });

  it("descarta comunas duplicadas", () => {
    expect(expectQuery("commune=Ñuñoa&commune=Ñuñoa").communes).toEqual([
      "Ñuñoa",
    ]);
  });

  it("interpreta los guiones del ejemplo de la especificación", () => {
    expect(expectQuery("commune=las-condes").communes).toEqual(["las condes"]);
  });

  it("mantiene ciudad y región como selección única", () => {
    const query = expectQuery("city=Santiago&region=Región+Metropolitana");

    expect(query.city).toBe("Santiago");
    expect(query.region).toBe("Región Metropolitana");
  });

  it("toma la primera ciudad si la URL repite el parámetro", () => {
    expect(expectQuery("city=Santiago&city=Temuco").city).toBe("Santiago");
  });

  it("rechaza una ubicación demasiado larga", () => {
    expect(expectError(`commune=${"a".repeat(121)}`)).toMatch(/120 caracteres/);
    expect(expectError(`city=${"a".repeat(121)}`)).toMatch(/120 caracteres/);
  });
});

describe("normalizeLocationValue", () => {
  it("convierte guiones en espacios", () => {
    expect(normalizeLocationValue("las-condes")).toBe("las condes");
    expect(normalizeLocationValue("vina-del-mar")).toBe("vina del mar");
  });

  it("colapsa espacios repetidos y recorta", () => {
    expect(normalizeLocationValue("  Las   Condes  ")).toBe("Las Condes");
  });
});

describe("parsePropertyListQuery — filtros combinados", () => {
  it("interpreta el ejemplo de la especificación", () => {
    const query = expectQuery("operation=SALE&commune=las-condes&bedrooms=3");

    expect(query).toEqual({
      operations: ["SALE"],
      communes: ["las condes"],
      bedrooms: 3,
    });
  });

  it("combina búsqueda con todos los filtros", () => {
    const query = expectQuery(
      "search=parque&operation=RENT&type=APARTMENT&type=HOUSE" +
        "&minPrice=800&maxPrice=2000&bedrooms=2&bathrooms=1&minUsableArea=50" +
        "&commune=Ñuñoa&commune=Providencia&city=Santiago" +
        "&region=Región+Metropolitana",
    );

    expect(query).toEqual({
      search: "parque",
      operations: ["RENT"],
      types: ["APARTMENT", "HOUSE"],
      minPrice: 800,
      maxPrice: 2000,
      bedrooms: 2,
      bathrooms: 1,
      minUsableArea: 50,
      communes: ["Ñuñoa", "Providencia"],
      city: "Santiago",
      region: "Región Metropolitana",
    });
  });
});

describe("parsePropertyListQuery — ordenamiento", () => {
  it("acepta los cinco criterios de la especificación", () => {
    for (const sort of [
      "newest",
      "price-asc",
      "price-desc",
      "area-asc",
      "area-desc",
    ]) {
      expect(expectQuery(`sort=${sort}`).sort).toBe(sort);
    }
  });

  it("rechaza un criterio desconocido en lugar de ignorarlo", () => {
    expect(expectError("sort=al-azar")).toMatch(/sort/);
  });

  it("omite el criterio cuando no viene", () => {
    expect(expectQuery("").sort).toBeUndefined();
    expect(expectQuery("sort=").sort).toBeUndefined();
  });
});

describe("buildPropertyOrderBy", () => {
  it("ordena por más recientes cuando no se indica criterio", () => {
    expect(buildPropertyOrderBy()).toEqual([{ createdAt: "desc" }]);
  });

  it("ordena por precio en ambas direcciones", () => {
    expect(buildPropertyOrderBy("price-asc")[0]).toEqual({ price: "asc" });
    expect(buildPropertyOrderBy("price-desc")[0]).toEqual({ price: "desc" });
  });

  it("ordena por superficie útil en ambas direcciones", () => {
    expect(buildPropertyOrderBy("area-asc")[0]).toEqual({
      usableAreaSquareMeters: { sort: "asc", nulls: "last" },
    });
    expect(buildPropertyOrderBy("area-desc")[0]).toEqual({
      usableAreaSquareMeters: { sort: "desc", nulls: "last" },
    });
  });

  it("manda al final las propiedades sin superficie, en ambas direcciones", () => {
    for (const sort of ["area-asc", "area-desc"] as const) {
      const [first] = buildPropertyOrderBy(sort);

      expect(first).toHaveProperty("usableAreaSquareMeters", {
        sort: expect.any(String),
        nulls: "last",
      });
    }
  });

  it("desempata siempre por fecha, para que el orden sea estable", () => {
    for (const sort of [
      "price-asc",
      "price-desc",
      "area-asc",
      "area-desc",
    ] as const) {
      const clauses = buildPropertyOrderBy(sort);

      expect(clauses).toHaveLength(2);
      expect(clauses[1]).toEqual({ createdAt: "desc" });
    }
  });
});

describe("buildPropertyWhere", () => {
  it("no restringe nada sin consulta ni alcance", () => {
    expect(buildPropertyWhere({})).toEqual({});
  });

  it("aplica el alcance de publicación", () => {
    expect(buildPropertyWhere({}, { isPublished: true })).toEqual({
      isPublished: true,
    });
  });

  it("traduce operaciones y tipos a las columnas del esquema", () => {
    expect(
      buildPropertyWhere({ operations: ["SALE"], types: ["HOUSE"] }),
    ).toEqual({
      operationType: { in: ["SALE"] },
      propertyType: { in: ["HOUSE"] },
    });
  });

  it("combina varios tipos con OR mediante «in»", () => {
    expect(buildPropertyWhere({ types: ["HOUSE", "APARTMENT"] })).toEqual({
      propertyType: { in: ["HOUSE", "APARTMENT"] },
    });
  });

  it("ignora las listas vacías", () => {
    expect(
      buildPropertyWhere({ operations: [], types: [], communes: [] }),
    ).toEqual({});
  });

  it("construye el rango de precio con los extremos presentes", () => {
    expect(buildPropertyWhere({ minPrice: 100 })).toEqual({
      price: { gte: 100 },
    });
    expect(buildPropertyWhere({ maxPrice: 900 })).toEqual({
      price: { lte: 900 },
    });
    expect(buildPropertyWhere({ minPrice: 100, maxPrice: 900 })).toEqual({
      price: { gte: 100, lte: 900 },
    });
  });

  it("trata dormitorios y baños como mínimo, no como igualdad", () => {
    expect(buildPropertyWhere({ bedrooms: 3, bathrooms: 2 })).toEqual({
      bedrooms: { gte: 3 },
      bathrooms: { gte: 2 },
    });
  });

  it("combina varias comunas con OR, sin distinguir mayúsculas", () => {
    expect(
      buildPropertyWhere({ communes: ["Las Condes", "Providencia"] }),
    ).toEqual({
      AND: [
        {
          OR: [
            { commune: { equals: "Las Condes", mode: "insensitive" } },
            { commune: { equals: "Providencia", mode: "insensitive" } },
          ],
        },
      ],
    });
  });

  it("compara ciudad y región sin distinguir mayúsculas", () => {
    expect(buildPropertyWhere({ city: "santiago", region: "rm" })).toEqual({
      city: { equals: "santiago", mode: "insensitive" },
      region: { equals: "rm", mode: "insensitive" },
    });
  });

  it("acumula búsqueda y comunas en el mismo AND, sin pisarse", () => {
    const where = buildPropertyWhere({
      search: "parque",
      communes: ["Ñuñoa"],
    });

    expect(where.AND).toHaveLength(2);
    expect(where.AND?.[0]).toHaveProperty("OR");
    expect(where.AND?.[1]).toEqual({
      OR: [{ commune: { equals: "Ñuñoa", mode: "insensitive" } }],
    });
  });

  it("combina todos los filtros en una sola condición", () => {
    const where = buildPropertyWhere(
      {
        operations: ["SALE"],
        types: ["APARTMENT", "HOUSE"],
        minPrice: 200000,
        maxPrice: 700000,
        bedrooms: 2,
        bathrooms: 2,
        minUsableArea: 70,
        communes: ["Vitacura"],
        city: "Santiago",
        region: "Región Metropolitana",
      },
      { isPublished: true },
    );

    expect(where).toEqual({
      isPublished: true,
      operationType: { in: ["SALE"] },
      propertyType: { in: ["APARTMENT", "HOUSE"] },
      price: { gte: 200000, lte: 700000 },
      bedrooms: { gte: 2 },
      bathrooms: { gte: 2 },
      usableAreaSquareMeters: { gte: 70 },
      city: { equals: "Santiago", mode: "insensitive" },
      region: { equals: "Región Metropolitana", mode: "insensitive" },
      AND: [{ OR: [{ commune: { equals: "Vitacura", mode: "insensitive" } }] }],
    });
  });
});
