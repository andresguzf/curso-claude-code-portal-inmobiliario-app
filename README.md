# Portal Inmobiliario

Portal inmobiliario full stack orientado al mercado chileno, desarrollado con
**Spec-Driven Development (SDD)** usando Claude Code.

Los visitantes pueden descubrir propiedades en venta y arriendo, buscarlas,
filtrarlas y consultar su detalle. Los usuarios registrados podrán guardar
favoritas, y los administradores gestionar el portal desde un área privada.

## Estado

Pasos 1 a 19b de `specs/portal-inmobiliario/tasks.md` completos.

| Funcionalidad | Estado |
|---|---|
| Portada con buscador y propiedades destacadas | ✅ |
| Catálogo con búsqueda textual | ✅ |
| Diez filtros combinables reflejados en la URL | ✅ |
| Ordenamiento por fecha, precio y superficie | ✅ |
| Estados de carga, vacío y error | ✅ |
| Detalle de propiedad | ✅ |
| Galería de imágenes | ✅ |
| Ubicación en Google Maps | ✅ |
| Formulario de contacto con Web3Forms | ✅ |
| API REST de autenticación | ✅ |
| Registro, login y sesión en la barra | ✅ |
| Autorización USER y ADMIN | ✅ |
| Área privada de la cuenta | ✅ |
| Edición de los propios datos | ✅ |
| Favoritos y consultas guardadas | Pasos 20-21 |
| Área de administración | Pasos 22-30 |

## Arquitectura

Monorepo con npm workspaces. Frontend y backend son aplicaciones Next.js
independientes que comparten un paquete de contratos.

```text
portal-inmobiliario/
├── apps/
│   ├── web/                  Frontend Next.js — puerto 3000
│   └── api/                  Backend Next.js + Prisma — puerto 3001
├── packages/
│   └── contracts/            DTOs y enumeraciones (@portal/contracts)
├── docker/                   Configuración de pgAdmin
└── specs/portal-inmobiliario/
    ├── spec.md               Qué debe hacer la aplicación
    ├── plan.md               Cómo se construye técnicamente
    └── tasks.md              Secuencia de 37 pasos
```

### Decisiones que conviene conocer

**El frontend no depende de Prisma.** El paquete de contratos declara los
DTOs y el vocabulario del dominio como TypeScript plano. El backend verifica
en tiempo de compilación que esas enumeraciones coincidan con el esquema de
Prisma, de modo que una divergencia rompa el build en lugar de llegar al
navegador.

**El navegador conoce un solo origen.** El frontend reescribe `/api/*` hacia
el backend, así que no hace falta CORS y las cookies de sesión funcionarán
como same-origin.

```text
Navegador → :3000/api/*  ──rewrite──→  :3001/api/*
Servidor  → API_INTERNAL_URL          (directo, sin salto extra)
```

**Búsqueda, filtros y ordenamiento se resuelven en PostgreSQL**, no cargando
el catálogo completo en el navegador. El estado vive en la URL, así que los
resultados son compartibles.

**La autorización se aplica en el backend.** El catálogo público solo expone
propiedades publicadas, y ningún filtro permite alcanzar un borrador.

## Requisitos

- Node.js 22 o superior
- Docker, para PostgreSQL

## Puesta en marcha

```bash
npm install
```

Levantar PostgreSQL:

```bash
docker run -d --name postgres --restart always -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
```

Crear la base de datos:

```bash
docker exec postgres psql -U postgres -c "CREATE DATABASE portal_inmobiliario;"
```

Copiar las plantillas de entorno y completar los valores:

```bash
cp apps/api/.env.example apps/api/.env && cp apps/web/.env.example apps/web/.env
```

Aplicar migraciones y cargar datos de ejemplo:

```bash
npm run db:migrate && npm run db:seed
```

Arrancar ambas aplicaciones:

```bash
npm run dev
```

El portal queda en <http://localhost:3000> y la API en
<http://localhost:3001>.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta frontend y backend en paralelo |
| `npm run dev:web` / `npm run dev:api` | Levanta solo una aplicación |
| `npm test` | Ejecuta las pruebas de los tres workspaces |
| `npm run lint` | Linter |
| `npm run typecheck` | Verificación de tipos |
| `npm run build` | Compila ambas aplicaciones |
| `npm run db:migrate` | Aplica migraciones |
| `npm run db:seed` | Carga datos de ejemplo (idempotente) |
| `npm run db:studio` | Abre Prisma Studio |

Para un workspace concreto: `npm run <script> -w @portal/web`.

## Datos de ejemplo

El seed carga 12 propiedades chilenas y 13 características, repartidas entre
venta y arriendo, en 9 comunas de 3 regiones. Dos quedan sin publicar a
propósito: el catálogo debe mostrar solo las publicadas, y sin ese contraste
no se puede verificar que el filtro funciona.

Es idempotente: ejecutarlo varias veces actualiza las mismas filas.

## Administrar la base de datos

pgAdmin, con el servidor preconfigurado:

```bash
docker run -d --name pgadmin --restart always -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@example.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  -e PGADMIN_CONFIG_SERVER_MODE=True \
  -e PGADMIN_CONFIG_PASSWORD_LENGTH_MIN=4 \
  -e PGADMIN_SERVER_JSON_FILE=/pgadmin4/servers.json \
  -v "$PWD/docker/pgadmin/servers.json:/pgadmin4/servers.json:ro" \
  -v pgadmin_data:/var/lib/pgadmin \
  --add-host=host.docker.internal:host-gateway \
  dpage/pgadmin4:latest
```

Queda en <http://localhost:5050>. Estas credenciales son para desarrollo
local: no expongas el puerto 5050 fuera de tu máquina.

## Diseño

La paleta vive en `apps/web/src/app/globals.css` como variables CSS expuestas
a Tailwind. Los componentes usan las utilidades resultantes y nunca colores
literales, así que ajustar la paleta no obliga a recorrerlos.

Header y pie oscuros enmarcan un cuerpo claro y cálido, con acento terracota
en precios y acciones. La interfaz es de tema claro único.

## Cuentas de desarrollo

El seed crea cinco cuentas. Sirven para probar el login en el navegador o en
Postman (`POST /api/auth/login`):

| Correo | Contraseña | Rol | Estado |
|---|---|---|---|
| `admin@portal.cl` | `admin1234` | ADMIN | activa |
| `maria@example.com` | `maria1234` | USER | activa |
| `pedro@example.com` | `pedro1234` | USER | desactivada |
| `ana@example.com` | `ana12345` | USER | activa |
| `bruno@example.com` | `bruno1234` | USER | activa |

La de Pedro está desactivada a propósito: sirve para comprobar que un usuario
inactivo no puede autenticarse. La contraseña de cada cuenta es su nombre
seguido de dígitos hasta alcanzar el mínimo de ocho caracteres. Estas
credenciales son solo para desarrollo.

## Limitaciones conocidas

- La búsqueda y los filtros de ubicación distinguen acentos: `nunoa` no
  encuentra `Ñuñoa`. Resolverlo requiere la extensión `unaccent` de
  PostgreSQL, previsto para el paso 32.
- Las imágenes del seed provienen de `picsum.photos`. Cloudinary se integra
  en el paso 26.
- El formulario de contacto necesita `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` en
  `apps/web/.env`, que se obtiene gratis en web3forms.com. Vive en el
  frontend porque el plan gratuito de Web3Forms solo acepta envíos desde el
  navegador. Una consulta enviada todavía no se guarda en PostgreSQL: la
  persistencia llega en el paso 21.
- El mapa del detalle necesita dos claves de Google Maps: una de
  geocodificación en `apps/api/.env` (`GOOGLE_MAPS_API_KEY`) y otra para el
  mapa del navegador en `apps/web/.env`
  (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). La segunda es pública por diseño y se
  protege restringiéndola por *referrer*. Sin ellas la ficha muestra la
  dirección y el enlace a Google Maps, pero no el mapa.

## Flujo de desarrollo

La especificación es la fuente de verdad. Antes de implementar, se leen
`spec.md`, `plan.md` y `tasks.md`; se toma la primera tarea pendiente, se
implementa solo esa, se valida y se marca como completada.

Las instrucciones permanentes para Claude Code están en `CLAUDE.md`.

Para continuar:

```text
Continúa con la siguiente tarea pendiente de tasks.md.

Consulta spec.md y plan.md cuando sea necesario.
Implementa únicamente esa tarea, valida los cambios y márcala
como completada cuando esté correctamente terminada.

No avances a la siguiente tarea.
```
