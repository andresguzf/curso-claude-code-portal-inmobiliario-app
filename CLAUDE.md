# CLAUDE.md

## Sobre la aplicación

Portal inmobiliario full stack orientado al mercado chileno. Los visitantes
descubren propiedades en venta y arriendo, las buscan, filtran y ordenan, y
consultan su detalle con fotografías, características y ubicación en el mapa.
Los usuarios registrados guardan favoritas y revisan sus consultas; los
administradores gestionan propiedades, imágenes, usuarios y solicitudes desde
un área privada.

Precios en USD. Tres roles: visitante, `USER` y `ADMIN`.

### Cómo está construido

- **Monorepo** con npm workspaces: `apps/web` (frontend), `apps/api`
  (backend) y `packages/contracts` (DTOs compartidos).
- **PostgreSQL** como única base de datos, con Prisma.
- **API REST** mediante Route Handlers. Sin Server Actions.
- El frontend **nunca** consulta la base de datos: siempre pasa por `/api/*`.
- El navegador ve un solo origen; el frontend reescribe `/api/*` al backend.
- Búsqueda, filtros y ordenamiento se resuelven **en PostgreSQL**, no en
  memoria, y su estado vive en la URL para que sea compartible.
- La autorización se aplica en el backend: el catálogo público solo expone
  propiedades publicadas, y ningún filtro permite alcanzar un borrador.

### Integraciones externas

Cloudinary para imágenes, Google Maps para ubicación y Web3Forms para el
formulario de contacto. Sus credenciales viven en `apps/api` y no llegan al
navegador, con dos excepciones deliberadas: la clave del Maps JavaScript API
y la de Web3Forms. Ambas son públicas por diseño, porque esos servicios se
ejecutan en el navegador —Web3Forms rechaza los envíos desde el servidor en
su plan gratuito—. Se protegen restringiéndolas por *referrer* y por dominio,
no ocultándolas, y viven en `apps/web/.env` con el prefijo `NEXT_PUBLIC_`
(plan.md, sección 15).

## Instrucciones del proyecto

Este proyecto utiliza **Spec-Driven Development (SDD)**.

Antes de implementar cualquier funcionalidad, lee:

- `specs/portal-inmobiliario/spec.md`
- `specs/portal-inmobiliario/plan.md`
- `specs/portal-inmobiliario/tasks.md`

La especificación es la fuente de verdad del proyecto.

## Flujo de desarrollo

1. Lee la especificación y el plan técnico.
2. Revisa `tasks.md`.
3. Identifica la primera tarea pendiente.
4. Implementa únicamente esa tarea.
5. Ejecuta las validaciones y pruebas necesarias.
6. Corrige los errores antes de continuar.
7. Marca la tarea como completada en `tasks.md`.
8. No implementes tareas futuras salvo que el usuario lo solicite explícitamente.

## Reglas de arquitectura

- Utiliza Next.js (version más reciente disponible) + React + TypeScript.
- Utiliza PostgreSQL como única base de datos de la aplicación.
- Utiliza API REST mediante Route Handlers de Next.js.
- No utilices Server Actions.
- Los componentes del frontend no deben acceder directamente a la base de datos.
- Mantén separadas las responsabilidades de API, lógica de negocio y persistencia.
- Utiliza Cloudinary para las imágenes de las propiedades.
- Utiliza Google Maps para mostrar la ubicación de las propiedades.
- Utiliza Web3Forms para el formulario de contacto.
- No expongas secretos al navegador.
- Utiliza variables de entorno para credenciales y claves.

## Reglas de implementación

- Analiza el código existente antes de modificarlo.
- Prefiere cambios pequeños e incrementales.
- No agregues funcionalidades fuera de la tarea actual.
- Mantén TypeScript estricto y evita `any` salvo que sea realmente necesario.
- Valida los datos recibidos por el backend.
- Protege los recursos USER y ADMIN también en el backend.
- Utiliza respuestas REST y códigos HTTP consistentes.
- Mantén la aplicación responsive.
- Respeta la arquitectura existente.

## Regla de finalización

Una tarea solo está terminada cuando:

- su implementación está completa;
- el proyecto compila correctamente;
- las pruebas o validaciones correspondientes pasan;
- no quedan errores bloqueantes conocidos;
- la casilla correspondiente de `tasks.md` está marcada como completada.

## Protocolo SDD (ESTRICTO)
1. ANTES de modificar o crear cualquier código fuente, DEBES leer `specs/portal-inmobiliario/spec.md`.
2. No escribas código sin un plan aprobado en `specs/portal-inmobiliario/plan.md`.
3. Sigue tu progreso línea por línea en `specs/portal-inmobiliario/tasks.md`. Marca las tareas como [x] solo después de que las pruebas (tests) hayan pasado con éxito.

## Estructura del proyecto

Monorepo con npm workspaces:

- `apps/web` — frontend Next.js (puerto 3000)
- `apps/api` — backend Next.js con los Route Handlers y Prisma (puerto 3001)
- `packages/contracts` — DTOs y enumeraciones compartidas (`@portal/contracts`)

El frontend no depende de Prisma. La comunicación entre ambos pasa por
`/api/*`, que el frontend reescribe hacia el backend.

## Comandos de Construcción y Pruebas

Desde la raíz, aplican a todos los workspaces:

- Instalar dependencias: `npm install`
- Ejecutar pruebas: `npm test`
- Ejecutar linter: `npm run lint`
- Verificar tipos: `npm run typecheck`
- Servidor de desarrollo (ambas apps): `npm run dev`
- Solo frontend / solo backend: `npm run dev:web` / `npm run dev:api`
- Base de datos: `npm run db:migrate`, `npm run db:seed`, `npm run db:studio`

Para un workspace concreto: `npm run <script> -w @portal/web`.

Formato de código: `npx prettier --write "apps/web/src/**/*.{ts,tsx,css}"`.

## Sistema de diseño

La paleta vive en `apps/web/src/app/globals.css` como variables CSS expuestas
a Tailwind mediante `@theme inline`. Los componentes usan las utilidades
resultantes y nunca colores literales.

| Token | Uso |
|---|---|
| `header`, `header-hover` | Barra superior y hero (azul grisáceo) |
| `footer` | Pie de página (gris pardo) |
| `page` | Fondo del cuerpo (arena cálida) |
| `card` | Tarjetas y paneles |
| `muted` | Superficies secundarias y marcadores de carga |
| `accent`, `accent-strong`, `accent-soft` | Precios, acciones y destacados (terracota) |
| `ink`, `ink-muted` | Texto sobre fondo claro |
| `on-dark`, `on-dark-muted` | Texto sobre fondo oscuro |
| `line`, `line-strong`, `line-on-dark` | Bordes |

La interfaz es de tema claro único: `globals.css` fija `color-scheme: light`.
Cambiar la paleta no debe requerir tocar componentes.

## Estado del proyecto

Pasos 1 a 22 de `tasks.md` completos. En funcionamiento: portada, catálogo
con búsqueda, filtros combinados, ordenamiento, estados de carga/vacío/error,
detalle de propiedad, galería, mapa de ubicación, formulario de contacto,
autenticación con autorización por rol, el área privada de la cuenta —con
edición de los propios datos, favoritos y consultas guardadas— y el panel de
administración con sus indicadores.

Pendiente desde el paso 23: el CRUD de propiedades y el resto del área de
administración.

### Autenticación

La sesión viaja en una cookie `httpOnly` firmada con `AUTH_SECRET`, nunca en
`localStorage`. El testigo solo lleva el identificador del usuario: el rol y
el estado de la cuenta se releen de PostgreSQL en cada petición, de modo que
desactivar a alguien o cambiarle el rol surta efecto en el acto.

Las contraseñas se guardan con `scrypt` de Node, con sal propia por
contraseña y los parámetros de coste dentro del hash para poder endurecerlos
sin invalidar lo ya guardado.

Existen `/login` y `/register`, y el header muestra la sesión: lo resuelve el
layout en el servidor, así que nadie ve un instante de «Ingresar» estando ya
dentro.

### Edición de la cuenta

`/account/edit` permite cambiar nombre, email y contraseña mediante
`PATCH /api/auth/me`. Se exige la contraseña actual para guardar **cualquier**
cambio, también uno de solo el nombre: es una regla única, sin condiciones que
puedan quedar mal escritas.

El rol y el estado de la cuenta no son editables desde ahí y no hay forma de
colarlos: el DTO no los declara, el validador los descarta y la firma del
repositorio no los admite. Enviarlos en el cuerpo no produce ningún efecto.

Esta funcionalidad no estaba en la especificación original: se añadió a
`spec.md` §17 y a `plan.md` §7 antes de implementarla.

### Consultas

Se guardan en PostgreSQL **antes** de que salga ningún correo, y se asocian a
quien tiene sesión; un visitante las envía igual y quedan con `userId` nulo.

En `/account` se muestran como registros —propiedad, mensaje y fecha—, con
buscador sobre el título de la propiedad y el texto del mensaje, y paginadas
de a seis. Búsqueda y página viven en la URL, como en el catálogo.

Eliminar una consulta la oculta del historial propio mediante
`hiddenByUserAt`, pero **no la borra**: sigue disponible para ADMIN, porque es
el contacto que la inmobiliaria debe responder y quien escribió no puede
hacerlo desaparecer. Esta funcionalidad no estaba en la especificación
original: se añadió a `spec.md` §17 y a `plan.md` §7 antes de implementarla.

Como la consulta ya está a salvo, un fallo de Web3Forms dejó de ser una
pérdida: se avisa de que quedó registrada y el mensaje no invita a reintentar,
porque reintentar la guardaría dos veces.

### Favoritos

Guardar y quitar son idempotentes: repetir la operación deja el mismo
resultado y no falla, que es lo que necesita un botón que alterna y coincide
con lo que HTTP espera de `DELETE`. La unicidad la garantiza el esquema
—`@@unique([userId, propertyId])`—, no la capa de servicios.

El identificador de la persona sale siempre de la sesión, nunca de un
parámetro: no hay nada que manipular para ver o alterar la lista de otra.

El botón se pinta solo si hay sesión, y esa distinción la da la propia API:
`GET /api/favorites/ids` responde 401 sin sesión y una lista vacía con ella.
Por eso `getFavoritePropertyIds` devuelve `undefined` frente a un conjunto
vacío, y son cosas distintas.

### Autorización

La decisión siempre la toma el backend. Hay tres piezas:

| Pieza | Dónde | Qué hace |
|---|---|---|
| `middleware.ts` | `apps/web` | Primera barrera de `/account/*` y `/admin/*`: solo mira si existe la cookie |
| `require-user.ts` | `apps/web` | Guarda de página: pregunta al backend quién es y con qué rol |
| `auth-guard.ts` | `apps/api` | Guarda de Route Handler: devuelve el usuario o la respuesta con la que cortar |

El `middleware` no valida la firma del testigo porque el frontend no tiene
`AUTH_SECRET` ni debe tenerlo: solo evita cargar una página privada a quien
claramente no ha entrado. La comprobación que manda es la de la página.

Ante un rol insuficiente, la API responde 403 y la página responde «no
existe». La diferencia es deliberada: a un programa le sirve el código
preciso, y a una persona curiosa no se le confirma que el área existe, igual
que la API pública devuelve 404 para una propiedad en borrador.

Cuentas del seed, solo para desarrollo:

| Correo | Contraseña | Rol | Estado |
|---|---|---|---|
| `admin@portal.cl` | `admin1234` | ADMIN | activa |
| `maria@example.com` | `maria1234` | USER | activa |
| `pedro@example.com` | `pedro1234` | USER | **desactivada** |
| `ana@example.com` | `ana12345` | USER | activa |
| `bruno@example.com` | `bruno1234` | USER | activa |

La de Pedro existe para comprobar que un usuario inactivo no puede entrar. La
contraseña de cada cuenta es su nombre seguido de dígitos hasta alcanzar el
mínimo de ocho caracteres que exige el backend.

### Limitaciones conocidas

- La búsqueda y los filtros de ubicación distinguen acentos: `nunoa` no
  encuentra `Ñuñoa`. Resolverlo requiere la extensión `unaccent` de
  PostgreSQL (previsto para el paso 32).
- Las imágenes del seed son de `picsum.photos`. Cloudinary se integra en el
  paso 26.
- El registro público solo da de alta cuentas con rol `USER`. El `ADMIN`
  llega por el seed.
- El formulario de contacto necesita `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` en
  `apps/web/.env`. Sin ella el formulario lo dice, en vez de dar por enviada
  una consulta que no salió. La clave está en el frontend porque el plan
  gratuito de Web3Forms solo acepta envíos desde el navegador: uno desde el
  servidor responde 403 con «Use our API in client side».
- El mapa del detalle necesita dos claves: `GOOGLE_MAPS_API_KEY` en
  `apps/api/.env` (Geocoding v4, deduce las coordenadas) y
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en `apps/web/.env` (Maps JavaScript API,
  dibuja el mapa). Sin ellas el detalle muestra la dirección y el enlace a
  Google Maps, pero no el mapa. La clave de demostración de Google Maps
  Platform sirve para ambas; no cubre Maps Static ni Maps Embed.

## Estilo de Código y Arquitectura
- Seguir los principios de Arquitectura Limpia (Clean Architecture).
- Usar nombres de variables explícitos. No usar abreviaturas.
- Cada nueva funcionalidad debe tener su prueba unitaria correspondiente.

## Available Skills

| Skill | Path | Description |
|---|---|---|
| `react-rules` | `.claude/skills/react-rules/SKILL.md` | Estándares de desarrollo y reglas de arquitectura para proyectos y componentes de React con TypeScript, Tailwind CSS, Zustand, Zod, React Hook Form y React Query / SWR. |
| `web-design-guidelines` | `.claude/skills/web-design-guidelines/SKILL.md` | Revisa el código de interfaz contra las Web Interface Guidelines de Vercel: accesibilidad, estados de foco, formularios, animación, tipografía, imágenes, rendimiento, navegación, áreas seguras, tematización e i18n. |
| `vercel-react-best-practices` | `.claude/skills/vercel-react-best-practices/SKILL.md` | Pautas de rendimiento de React y Next.js de Vercel Engineering: componentes, obtención de datos, tamaño de bundle y optimización. |

---

## Skill Trigger Rules

### `react-rules`
- **Activación**: Activar esta habilidad cuando el usuario pida:
  - Crear una nueva aplicación React o generar su estructura con TypeScript.
  - Crear, agregar o modificar componentes de React y maquetación con Tailwind CSS.
  - Diseñar e implementar Custom Hooks (`useAuth`, `useFetch`, etc.).
  - Gestionar estado global utilizando Zustand (`create()`).
  - Crear esquemas de validación de datos utilizando Zod (`z.object`, `z.string`, `parse`, `safeParse`).
  - Implementar formularios utilizando React Hook Form con resolver de Zod.
  - Implementar lógica de UI o fetching de APIs utilizando TanStack Query (React Query) o SWR.
  - Refactorizar código React para cumplir con principios de inmutabilidad, pureza y correcto uso de `useEffect`.

### `web-design-guidelines`
- **Activación**: Activar esta habilidad cuando el usuario pida:
  - Cambiar el look and feel, la paleta de colores, el diseño visual o el tema.
  - Revisar o auditar la interfaz, la accesibilidad, la usabilidad o la experiencia de uso.
  - Crear o modificar formularios, estados de foco, animaciones o estados de carga.
  - Trabajar en comportamiento responsive, modo oscuro o áreas seguras.
  - Implementar los pasos 33 (responsive y accesibilidad) y 35 (QA integral) de `tasks.md`.
- **Nota**: la habilidad descarga las reglas vigentes desde su URL de origen en cada
  ejecución. Requiere acceso de red.

### `vercel-react-best-practices`
- **Activación**: Activar esta habilidad cuando el usuario pida:
  - Optimizar el rendimiento de React o Next.js.
  - Revisar obtención de datos, Server Components, `Suspense`, streaming o caché.
  - Reducir el tamaño del bundle o eliminar renderizados innecesarios.
  - Implementar el paso 32 (optimización) de `tasks.md`.
