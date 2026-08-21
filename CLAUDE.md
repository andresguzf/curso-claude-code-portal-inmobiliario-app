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
| `danger` | Mensajes de error y bordes de campo inválido |

El portal público es de tema claro único. El **panel de administración**
admite claro y oscuro: el layout de `(admin)` marca `data-theme` en `<html>`
y `globals.css` redefine ahí los mismos tokens. Cambiar de tema no toca ni
una clase de componente.

La preferencia viaja en una cookie, no en `localStorage`, para que el
servidor pinte el tema correcto desde el primer byte y no haya un parpadeo de
claro antes de oscuro. El interruptor además cambia el atributo en el acto,
para no esperar al servidor.

`danger` existe aparte de `accent-strong` aunque en claro coincidan: aquel es
el hover de los botones y debe **oscurecerse** para que el texto blanco siga
leyéndose, mientras que el error debe **aclararse** sobre fondo oscuro.
Servían al mismo valor por casualidad, no por diseño.

Contraste verificado en ambos temas: todos los pares de texto superan 4.5:1.
El más justo es el texto claro sobre el acento en oscuro, con 4.53.

## Estado del proyecto

Pasos 1 a 29 de `tasks.md` completos. En funcionamiento: portada, catálogo
con búsqueda, filtros combinados, ordenamiento, estados de carga/vacío/error,
detalle de propiedad, galería, mapa de ubicación, formulario de contacto,
autenticación con autorización por rol, el área privada de la cuenta —con
edición de los propios datos, favoritos y consultas guardadas— y el panel de
administración con sus indicadores y el alta, edición y baja de propiedades.

Pendiente desde el paso 30: la gestión de consultas.

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

Solo figuran las de propiedades que siguen en el catálogo público, igual que
en favoritos: una eliminada o despublicada no tiene ficha que abrir, y el
registro llevaría a un 404. La consulta no se pierde —ADMIN la conserva para
responderla—, simplemente deja de aparecer ahí.

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

### Área de administración

El panel tiene su **propia raíz**, no una capa sobre el portal: las rutas
viven en `app/(admin)/` y `app/(public)/`, cada una con su `layout.tsx` con
`<html>`. Así el panel no arrastra la cabecera ni el pie públicos.

La disposición es un marco de dashboard: barra lateral colapsable a la
izquierda —a solo iconos en escritorio, como panel deslizante en móvil— y
cabecera propia con quién administra, la salida al portal y cerrar sesión.

En la barra solo figuran las secciones que existen. Un enlace que lleva a un
404 hace dudar de si el panel está roto o la sección aún no está hecha.

**ADMIN no tiene nada personal**: ni favoritos, ni consultas, ni área de
cuenta. Sus datos y su contraseña se editan en `/admin/profile`. No es solo
que se oculte: `/api/favorites*` y el historial de consultas responden **403**
a una sesión ADMIN, y `/account` la redirige al panel. Una consulta enviada
por ADMIN se guarda sin usuario asociado, porque no tendría dónde aparecer.

Sobre su propia cuenta, ADMIN no puede desactivarse ni quitarse el rol: el
registro público solo crea `USER`, así que hacerlo dejaría el portal sin
administración y sin forma de recuperarla. Ambas responden **403**, y la
interfaz además no pinta esos controles en su propia fila —pero eso es
cortesía: quien decide es el backend.

### Administración de propiedades

El CRUD vive en `/api/admin/properties` y lo protege `requireAdmin`. A
diferencia del catálogo público, aquí no hay filtro por `isPublished`: quien
administra ve también los borradores.

Una propiedad **nace despublicada** salvo que se pida lo contrario: es
preferible que algo a medio escribir no aparezca en el portal a que aparezca
por omisión.

`publishedAt` la sella el repositorio la primera vez que se publica, y no
viaja en el formulario: es una consecuencia de publicar, no un campo que
alguien rellene. Al despublicar **se conserva** —destruir una fecha es
destruir información— y al republicar no se resella. Si está publicada ahora
lo responde `isPublished`, que es un dato distinto. Las filas anteriores a la
columna se rellenaron con su fecha de alta: no es exacta, pero dejarlas en
nulo las escondería de cualquier filtro por fecha.

`PUT` reemplaza la propiedad entera, características incluidas, con `set` y
no `connect`: quien envía el formulario manda la lista definitiva, y con
`connect` quitar una característica no tendría ningún efecto.

`DELETE` es un **borrado lógico**: marca `deletedAt` y la propiedad deja de
existir para el catálogo, para la administración y para las listas de
cualquier persona, pero sus consultas y los favoritos ajenos sobreviven.
Borrarla de verdad destruiría contactos comerciales que quien administra no
siempre sabe que existen.

La condición `deletedAt: null` vive en un solo sitio por cada frente:
`buildPropertyWhere` para todo el catálogo público, y `property-scope.ts`
para favoritos, consultas e indicadores. Repartirla por cada consulta es lo
que se olvida en la siguiente que alguien escriba, y el olvido no se nota
hasta que una propiedad borrada reaparece.

Para retirar una propiedad del catálogo conservándola a la vista de la
administración está despublicarla, que es una acción distinta.

### Interfaz de propiedades

`/admin/properties` lista todo —borradores incluidos— en una tabla, no en
una cuadrícula de tarjetas: aquí se compara entre filas, y para eso sirven
las columnas. La búsqueda, los filtros y la página viven en la URL y los
resuelve PostgreSQL, igual que en el catálogo.

Los filtros —precio, estado, tipo, operación y fecha de publicación— están
en un panel colapsable **a la derecha**: a la izquierda ya está la barra de
secciones, y dos barras enfrentadas dejarían la tabla sin sitio. Contraído
dice cuántos hay puestos, para que nadie olvide que ve un listado acotado.

En escritorio se contrae **en horizontal**, de 288 a 48 píxeles, y la tabla
gana esos 255. Contraerlo en vertical no devolvía nada: la columna seguía
reservada y vacía. En móvil se contrae en vertical, porque allí va apilado
sobre la tabla y una pestaña lateral no le quitaría sitio a nadie.

Un filtro inválido escrito a mano en la URL produce un 400 con su motivo, y
la página lo dice. El cliente REST reenvía los parámetros **sin
interpretarlos**: descartarlos en silencio mostraría un listado que no
corresponde a lo pedido, que es peor que un error.

El alta y la edición comparten **un solo formulario**. Los campos son los
mismos y duplicarlo garantizaría que uno se quedase atrás al añadir el
siguiente; lo único que cambia es a dónde va al guardar.

Sus campos no llevan autocompletado. Los datos son de la propiedad, no de
quien los escribe: con `autocomplete="street-address"`, el navegador ofrecía
la dirección de quien administra, que es justo lo que no va en esa ficha.

Los valores iniciales se pintan además como atributos `defaultValue`. React
Hook Form los asigna al hidratar, así que sin ellos el servidor mandaba una
ficha de edición en blanco y los datos aparecían un instante después.

Las características son casillas y no texto libre: el backend las conecta por
`slug` contra la tabla `features`, y una escrita a mano no existiría. Las
ofrece `GET /api/admin/features`. Un `slug` inexistente se rechaza con 400 y
dice cuál sobra, en vez de hacer fallar al ORM y responder un 500 mudo.

### Características

`/admin/features` permite crear, renombrar y eliminar. Ampliar el vocabulario
es dar de alta una fila: `Property` no tiene una columna por característica, y
eso es lo que hace que no haga falta ni migración ni despliegue.

El `slug` lo deriva el servidor del nombre —sin acentos, en minúsculas, con
guiones— y **no cambia al renombrar**: es con lo que las propiedades quedan
enlazadas, así que corregir una errata rompería esas referencias.

Un nombre repetido responde **409** y dice cuál choca. La comparación ignora
mayúsculas y acentos, porque «Lavanderia» y «Lavandería» darían el mismo
`slug` y chocarían igualmente en la base.

Al eliminar, las propiedades que la declaraban dejan de hacerlo y no pierden
nada más. El diálogo dice a cuántas afecta con el número delante: «dejará de
figurar» a secas ocultaría que toca fichas ya publicadas.

Se pinta como lista y no como tabla: son cuatro datos por fila y ninguno se
compara entre filas. Con tabla, a poca anchura los botones quedaban fuera del
área visible y la sección parecía no tener acciones.

Si el renombrado falla, la fila **sigue abierta** con lo escrito dentro y el
aviso aparece en la propia fila. Cerrarla perdía el texto y dejaba el mensaje
al pie de la página, fuera de la pantalla: la operación parecía no hacer nada.

El foco y la selección del texto se piden en un efecto, no con `autoFocus`:
ese atributo enfoca antes de que React tenga puesto su escuchador, así que un
`onFocus` que seleccione no llega a ejecutarse.

Un campo numérico vacío viaja como `null`, no como cero: una propiedad por
estrenar tiene cero años de antigüedad, y un terreno no declara dormitorios;
son cosas distintas y el formulario las distingue en ambos sentidos.

### Imágenes

`POST /api/admin/properties/{id}/images` sube una imagen a Cloudinary y la
asocia a la propiedad. El cuerpo es `multipart/form-data`: lo que viaja es un
archivo, no un JSON.

El archivo pasa **por la API** camino de Cloudinary, no directo desde el
navegador: la firma exige el secreto de la cuenta y ese secreto no sale del
servidor. Se habla con su API REST sin el SDK —dos llamadas y una firma
SHA-1—, igual que con Geocoding y Web3Forms.

Todas aterrizan en la carpeta `propiedades-claude`, para poder revisarlas o
borrarlas en bloque sin tocar el resto de la cuenta.

Se admiten JPG, PNG, WebP y AVIF. **No** `image/svg+xml`: también es una
imagen, y admite scripts. Tipo y tamaño se comprueban antes de subir, porque
al revés un archivo rechazado habría gastado igualmente una llamada.

Los códigos distinguen de quién es el problema: 400 el formato, 413 el
tamaño, 404 la propiedad, **503** si el entorno no tiene credenciales y
**502** si Cloudinary falla. Los dos últimos no son lo mismo: uno no tiene
nada que reintentar.

Si la subida sale bien pero la fila no llega a guardarse, se elimina el
recurso recién subido. Un archivo que nada referencia es un huérfano que
nadie sabría que sobra.

La primera imagen de una propiedad queda como principal: sin portada no se
pintaría en el catálogo.

La galería se administra desde la ficha de edición, en su propia sección:

| Verbo | Ruta | Qué hace |
|---|---|---|
| `PUT` | `…/images` | Fija el orden con la lista **completa** de identificadores |
| `PATCH` | `…/images/{id}` | Marca esa imagen como portada |
| `DELETE` | `…/images/{id}` | La quita de la propiedad y de Cloudinary |

`PUT` exige la lista entera, como el `PUT` de la propiedad exige la lista
definitiva de características: una parcial dejaría posiciones a medias, y dos
peticiones seguidas con movimientos relativos se pisarían.

Al eliminar se borra **primero la fila y después el archivo**. Al revés, un
fallo en el segundo paso dejaría una imagen rota en la ficha; en este orden
lo peor que queda es un archivo huérfano, que cuesta almacenamiento pero no
se le aparece a nadie. Por eso un fallo de Cloudinary no se propaga: para
quien administra la imagen ya no está, que es lo que pidió, y el huérfano
queda anotado en el log.

Si se elimina la portada, asciende la primera de las que quedan. Reordenar,
cambiar la portada y ese ascenso van en transacción: a medio hacer dejarían
dos portadas o dos imágenes en la misma posición.

Estos cambios **no** esperan al botón de guardar del formulario: operan sobre
un archivo que ya está subido, y mezclarlos con el borrador de los demás
campos haría que cancelar la edición dejara a medias algo que ya ocupa sitio
en Cloudinary.

### Administración de usuarios

`/admin/users` lista las cuentas con búsqueda por nombre o email y filtros
por rol y estado. Cada fila dice cuántos favoritos y cuántas consultas tiene,
que es la forma rápida de saber si la cuenta se usa.

`POST /api/admin/users` da de alta una cuenta con su contraseña inicial y
con el rol que se pida. Es la **única vía dentro de la aplicación** para
crear un segundo ADMIN: el registro público solo crea `USER`. La contraseña
la fija quien crea la cuenta y hay que comunicársela a su destinatario; no
se puede recuperar después, solo reemplazar.

`PATCH /api/admin/users/{id}` cambia nombre, email, contraseña, rol o estado:
lo que no viaja no se toca. **Quién** hace la petición sale de la sesión,
nunca del cuerpo, y es lo que hace imposible saltarse las reglas de la propia
cuenta diciendo ser otra persona.

A diferencia de `/account/edit`, aquí **no** se pide la contraseña actual:
quien administra no la conoce. Es la contrapartida del rol, y por eso el
formulario avisa de que cambiarla deja fuera a esa persona hasta que se le
comunique la nueva.

Desactivar surte efecto en el acto —comprobado: el login pasa a responder
401— porque el estado se relee de PostgreSQL en cada petición.

El listado va paginado de diez en diez, como el de propiedades. El control no
se pinta cuando solo hay una página: unos botones inertes ocupan sitio y
hacen dudar de si algo falló.

Los filtros de esta pantalla son enlaces y no un formulario: con dos filtros
de tres opciones, un panel plegable sería más maquinaria de la necesaria, y
así se pueden abrir en otra pestaña.

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
- Las imágenes del seed siguen siendo de `picsum.photos`: el seed no sube
  nada a Cloudinary, para no gastar la cuota de la cuenta en datos de
  desarrollo que se recrean a menudo.
- El registro público solo da de alta cuentas con rol `USER`. Un `ADMIN`
  llega por el seed o lo crea otro `ADMIN` desde `/admin/users`.
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
