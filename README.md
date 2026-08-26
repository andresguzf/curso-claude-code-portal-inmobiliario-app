# Portal Inmobiliario

Portal inmobiliario full stack orientado al mercado chileno, desarrollado con
**Spec-Driven Development (SDD)** usando Claude Code.

Los visitantes descubren propiedades en venta y arriendo, las buscan, filtran
y ordenan, y consultan su detalle con fotografías, características y ubicación
en el mapa. Los usuarios registrados guardan favoritas y revisan sus
consultas; los administradores gestionan propiedades, imágenes, usuarios y
solicitudes desde un área privada.

## Estado

**Terminado.** Los 39 pasos de `specs/portal-inmobiliario/tasks.md` están
completos y el ciclo de SDD ha convergido: la especificación, el plan y el
código dicen lo mismo.

| Portal público | |
|---|---|
| Portada con buscador y propiedades destacadas | ✅ |
| Catálogo con búsqueda textual, que ignora acentos y eñes | ✅ |
| Paginación de nueve por página, compatible con filtros y orden | ✅ |
| Diez filtros combinables reflejados en la URL | ✅ |
| Ordenamiento por fecha, precio y superficie | ✅ |
| Estados de carga, vacío y error | ✅ |
| Detalle de propiedad, galería y ubicación en Google Maps | ✅ |
| Formulario de contacto con Web3Forms | ✅ |
| Metadata por ficha: título, descripción, canónica y Open Graph | ✅ |

| Cuenta de usuario | |
|---|---|
| Registro, login y sesión resuelta en el servidor | ✅ |
| Autorización USER y ADMIN | ✅ |
| Área privada con edición de los propios datos | ✅ |
| Favoritos | ✅ |
| Consultas guardadas, con buscador y paginación | ✅ |

| Administración | |
|---|---|
| Panel propio con indicadores y tema claro/oscuro | ✅ |
| CRUD de propiedades, con publicar y destacar | ✅ |
| Listado con filtros en panel colapsable | ✅ |
| Imágenes en Cloudinary: subir, ordenar, portada y eliminar | ✅ |
| Características: crear, renombrar y eliminar | ✅ |
| Usuarios: alta, rol, estado y contraseña | ✅ |
| Consultas recibidas | ✅ |

| Calidad | |
|---|---|
| Responsive y accesibilidad revisadas | ✅ |
| Cabeceras de seguridad y límite de intentos | ✅ |
| Mensajes de confirmación en toda acción que cambia algo | ✅ |
| QA de los tres roles y reglas de arquitectura verificadas | ✅ |

### Validaciones

| | |
|---|---|
| Pruebas | 962 · api 404 · web 539 · contracts 19 |
| Lint · typecheck · build | limpios |
| Criterios de aceptación de `spec.md` §26 | 21/21 verificados por HTTP |

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
    └── tasks.md              Secuencia de 39 pasos, todos completos
```

### Cómo encajan las piezas

**El frontend no depende de Prisma.** El paquete de contratos declara los
DTOs y el vocabulario del dominio como TypeScript plano. El backend verifica
en tiempo de compilación que esas enumeraciones coincidan con el esquema de
Prisma, de modo que una divergencia rompa el build en lugar de llegar al
navegador.

**El navegador conoce un solo origen.** El frontend reescribe `/api/*` hacia
el backend, así que no hace falta CORS y las cookies de sesión funcionan
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

Levantar PostgreSQL. En local, un contenedor; en un servidor, cualquier
PostgreSQL gestionado —este proyecto usa Supabase, y la sección
**Despliegue** explica qué cadena de conexión elegir y por qué:

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
en precios y acciones.

El **portal público** es de tema claro único. El **panel de administración**
admite claro y oscuro: el layout marca `data-theme` en `<html>` y la hoja de
estilos redefine ahí los mismos tokens, así que cambiar de tema no toca ni una
clase de componente.

La preferencia viaja en una cookie y no en `localStorage`, para que el
servidor pinte el tema correcto desde el primer byte y no haya un parpadeo de
claro antes de oscuro.

Contraste verificado en ambos temas: todos los pares de texto superan 4.5:1.

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

## Cómo se comporta el portal

**Los borrados son lógicos.** Eliminar una propiedad desde la administración
conserva la fila y la hace desaparecer de todas las vistas. El motivo es que
arrastra consultas, que son contactos comerciales, y favoritos ajenos. Para
retirarla del catálogo conservándola a la vista de la administración está
despublicarla, que es una acción distinta.

Lo mismo al eliminar una consulta desde la cuenta: se oculta del historial
propio, pero la inmobiliaria la conserva para responderla.

**ADMIN no tiene nada personal.** Ni favoritos, ni consultas, ni área de
cuenta: sus datos se editan desde el panel. No es solo que se oculte —la API
responde 403 a una sesión ADMIN en esos endpoints—. Y sobre su propia cuenta
no puede desactivarse ni quitarse el rol: el registro público solo crea
`USER`, así que hacerlo dejaría el portal sin administración.

**La búsqueda ignora acentos y eñes.** `montana` encuentra «montaña» y
`nunoa` encuentra «Ñuñoa». Cada fila guarda una copia normalizada de los
campos por los que se busca, y las consultas comparan contra ella. La regla
vive en el paquete de contratos y se aplica dos veces: al guardar la fila y al
preparar lo que se teclea. Si divergieran, lo guardado y lo buscado dejarían
de encontrarse.

**Toda acción que cambia algo lo dice.** Los avisos aparecen arriba, se van
solos a los cinco segundos y se pueden cerrar antes; la cuenta atrás se
detiene con el puntero encima. La cola vive en `sessionStorage` porque el
portal y el panel son dos documentos distintos, y entrar como ADMIN salta de
uno al otro: cualquier cosa en memoria se perdería justo en la navegación que
había que anunciar.

## Seguridad

La decisión siempre la toma el backend. Que la interfaz esconda un botón no
impide a nadie llamar a la API.

**Cabeceras.** Política de contenido, `frame-ancestors` y `X-Frame-Options`,
`nosniff`, política de *referrer* y restricción de permisos. Van en el
`next.config.ts` de cada aplicación, no en el middleware, para que alcancen
también a los archivos estáticos. El panel no puede incrustarse en otro sitio:
un marco invisible convierte un clic de quien administra en algo que no quiso
hacer.

**Sesión.** Cookie `httpOnly` firmada, nunca `localStorage`. El testigo solo
lleva el identificador; el rol y el estado se releen de PostgreSQL en cada
petición, de modo que desactivar a alguien surta efecto en el acto. Las
contraseñas se guardan con `scrypt`, con sal propia y los parámetros de coste
dentro del hash.

**Caché.** Toda respuesta de la API lleva `Cache-Control: no-store`. Se decide
en el constructor de la respuesta: lo que hay que repetir en cada archivo
nuevo es lo que se olvida.

**Intentos de login.** Dos contadores, porque protegen de cosas distintas.

| Contador | Clave | Ventana | De qué protege |
|---|---|---|---|
| Fino | IP + cuenta | 5 cada 5 min | De que adivinen esa contraseña |
| Grueso | IP | 20 cada 5 min | De que agoten CPU y memoria |

El fino va por cuenta y no solo por IP porque una IP no es una máquina:
detrás de un NAT salen muchas personas, y contar solo por IP hacía que quien
tecleaba mal su contraseña dejara fuera a toda su oficina. El grueso existe
porque el fino, solo, se esquiva cambiando de correo en cada intento, y cada
intento cuesta un `scrypt` de 16 MiB aunque el correo no exista.

Solo cuentan los intentos fallidos. Acertar pone los dos contadores a cero.

**CSRF.** No hacen falta testigos: la cookie es `SameSite=Lax` y el navegador
ve un solo origen, así que una petición desde otro sitio no la lleva. No hay
ningún `GET` que cambie estado.

## Despliegue

En producción son **dos proyectos de Vercel**, uno por aplicación, y una base
de datos en Supabase.

| Proyecto | Root Directory | Qué sirve |
|---|---|---|
| api | `apps/api` | Los Route Handlers. Habla con PostgreSQL |
| web | `apps/web` | El portal. Reescribe `/api/*` hacia el api |

Variables por proyecto:

```text
api   DATABASE_URL · AUTH_SECRET · GOOGLE_MAPS_API_KEY
      CLOUDINARY_CLOUD_NAME · CLOUDINARY_API_KEY · CLOUDINARY_API_SECRET

web   API_INTERNAL_URL · SITE_URL
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY · NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY
```

`DATABASE_URL` y `AUTH_SECRET` **lanzan al arrancar** si faltan; no degradan.
Las tres de Cloudinary hacen que subir una imagen responda 503, y sin la de
Geocoding el detalle no trae coordenadas.

### Tres cosas que cuestan una tarde si no se saben

**`API_INTERNAL_URL` se hornea en el build.** Se interpola dentro de
`next.config.ts`, así que cambiarla en el panel no basta: hay que redesplegar
el portal, y sin la caché de build.

**Los despliegues de *preview* están protegidos.** Vercel exige autenticación
en las URL generadas, y responde 401 antes de ejecutar una línea de código. El
portal llama al api **desde su servidor**, sin cabeceras, así que
`API_INTERNAL_URL` debe apuntar al **dominio de producción** del api, que en el
plan gratuito sí es público. Para llamar a un *preview* a mano —Postman,
pruebas— se genera un secreto en Deployment Protection y se envía como
cabecera `x-vercel-protection-bypass`.

**Las variables van por entorno.** Una marcada solo para *Preview* se ve en la
lista y no llega al build de producción.

### La sesión sigue funcionando entre dos dominios

Es lo que suele romperse al separar frontend y backend, y aquí no se rompe: el
navegador ve **un solo origen**. La reescritura de `/api/*` actúa de proxy, el
api devuelve su `Set-Cookie` sin atributo `Domain`, y el navegador se la
atribuye al dominio del portal. Ni CORS ni `SameSite=None`. En producción la
cookie sale además con `Secure`.

## Limitaciones conocidas

- **Las imágenes del seed vienen de `picsum.photos`.** El seed no sube nada a
  Cloudinary, para no gastar la cuota de la cuenta en datos de desarrollo que
  se recrean a menudo. Las que se suben desde el panel sí van a Cloudinary.
- **El registro público solo crea cuentas `USER`.** Un `ADMIN` llega por el
  seed o lo crea otro `ADMIN` desde `/admin/users`.
- **El límite de intentos vive en memoria del proceso.** Con varias instancias
  cada una lleva su cuenta, lo que relaja el límite pero no lo anula. Un
  almacén compartido es la evolución natural cuando haya más de un proceso.
- **El formulario de contacto necesita `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`** en
  `apps/web/.env`, que se obtiene gratis en web3forms.com. Vive en el frontend
  porque el plan gratuito de Web3Forms solo acepta envíos desde el navegador.
  Sin esa clave la consulta se guarda igualmente: lo que no sale es el aviso
  por correo.
- **El mapa del detalle necesita dos claves de Google Maps:** una de
  geocodificación en `apps/api/.env` (`GOOGLE_MAPS_API_KEY`) y otra para el
  mapa del navegador en `apps/web/.env`
  (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). La segunda es pública por diseño y se
  protege restringiéndola por *referrer*. Sin ellas la ficha muestra la
  dirección y el enlace a Google Maps, pero no el mapa.

## Flujo de desarrollo

La especificación es la fuente de verdad. Antes de implementar, se leen
`spec.md`, `plan.md` y `tasks.md`; se toma la primera tarea pendiente, se
implementa solo esa, se valida y se marca como completada.

Las instrucciones permanentes para Claude Code están en `CLAUDE.md`, junto con
el detalle de cada decisión y por qué se tomó.

**El backlog está cerrado.** No queda ninguna tarea pendiente en `tasks.md`,
así que lo siguiente ya no sale de esa lista. Para cualquier funcionalidad
nueva, el ciclo empieza donde empezó todo: añadirla a `spec.md` y a `plan.md`
antes de escribir código, como se hizo con la edición de la cuenta, el
historial de solicitudes y los mensajes de confirmación, que tampoco estaban
en la especificación original.

```text
Quiero añadir <funcionalidad>.

Añádela primero a spec.md y a plan.md, explicando qué debe hacer y cómo
encaja con lo que ya existe. Después impleméntala, con sus pruebas, y
ejecuta las validaciones.
```
