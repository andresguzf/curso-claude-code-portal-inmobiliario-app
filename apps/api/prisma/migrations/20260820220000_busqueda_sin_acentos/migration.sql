-- Búsqueda que ignora acentos y eñes (spec.md, sección 9).
--
-- «montana» debe encontrar «montaña» y «concon» debe encontrar «Concón». Sin
-- esto, quien escribe sin acentos —lo habitual en un buscador— no encuentra
-- nada, y quien no sabe cómo se escribe una comuna tampoco.
--
-- Se guarda una copia normalizada de los campos por los que se busca, y las
-- consultas comparan contra ella. La alternativa —`unaccent()` dentro de cada
-- consulta— exigiría SQL en crudo en todos los buscadores de la aplicación.
--
-- Las columnas las escribe la aplicación, no PostgreSQL: una columna generada
-- sería más difícil de olvidar, pero Prisma no las modela y cada migración
-- futura propondría un `ALTER` espurio que además fallaría al aplicarse.

ALTER TABLE "properties"
  ADD COLUMN "search_text" text,
  ADD COLUMN "commune_normalized" text,
  ADD COLUMN "city_normalized" text,
  ADD COLUMN "region_normalized" text;

ALTER TABLE "users" ADD COLUMN "search_text" text;

ALTER TABLE "inquiries" ADD COLUMN "search_text" text;

-- Relleno de lo que ya existe.
--
-- Reproduce carácter por carácter lo que hace `normalizeSearchText` en
-- `@portal/contracts`: descomponer en `NFD`, descartar las marcas
-- combinantes —ahí van las tildes y la virgulilla de la eñe—, minúsculas y
-- espacios colapsados.
--
-- Se evita a propósito la extensión `unaccent`: además de las tildes toca la
-- puntuación —convierte «¿» en «?»—, y entonces lo rellenado aquí y lo que
-- escribe la aplicación dejarían de coincidir.
CREATE OR REPLACE FUNCTION portal_normalize(texto text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $fn$
  SELECT btrim(regexp_replace(
    lower(regexp_replace(
      normalize(coalesce(texto, ''), NFD), E'[\u0300-\u036F]', '', 'g'
    )),
    '\s+', ' ', 'g'
  ))
$fn$;

UPDATE "properties" SET
  "search_text" = portal_normalize(
    coalesce(title, '') || ' ' ||
    coalesce(commune, '') || ' ' ||
    coalesce(city, '') || ' ' ||
    coalesce(region, '') || ' ' ||
    coalesce(address, '') || ' ' ||
    coalesce(description, '')
  ),
  "commune_normalized" = portal_normalize(commune),
  "city_normalized" = portal_normalize(city),
  "region_normalized" = portal_normalize(region);

UPDATE "users" SET
  "search_text" = portal_normalize(coalesce(name, '') || ' ' || coalesce(email, ''));

UPDATE "inquiries" SET
  "search_text" = portal_normalize(
    coalesce(name, '') || ' ' ||
    coalesce(email, '') || ' ' ||
    coalesce(message, '')
  );

-- La función solo servía para el relleno; la aplicación mantiene la columna
-- de aquí en adelante.
DROP FUNCTION portal_normalize(text);

-- Las igualdades de ubicación se resuelven por índice. La búsqueda libre usa
-- `LIKE '%…%'`, que no puede aprovecharlo, pero los listados van paginados y
-- el volumen de un portal inmobiliario no lo justifica todavía.
CREATE INDEX "properties_commune_normalized_idx" ON "properties" ("commune_normalized");
CREATE INDEX "properties_city_normalized_idx" ON "properties" ("city_normalized");
CREATE INDEX "properties_region_normalized_idx" ON "properties" ("region_normalized");
