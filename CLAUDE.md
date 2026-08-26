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

**`tasks.md` está cerrado: los 39 pasos están completos.** El paso 3 no
encontrará nada pendiente, y eso no es un error. Para cualquier funcionalidad
nueva el ciclo empieza antes: se añade a `spec.md` y a `plan.md`, y solo
entonces se escribe código. Así se hicieron la edición de la cuenta, el
historial de solicitudes y los mensajes de confirmación, que tampoco estaban
en la especificación original.

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
| `sidebar`, `sidebar-hover`, `sidebar-ink`, `sidebar-ink-muted`, `sidebar-line` | Barra lateral del panel: clara en tema claro, hundida en oscuro |
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

La barra lateral tiene tokens propios y no los del header público. En claro
es una superficie clara, como el resto del panel; el header del portal sigue
siendo oscuro. Compartir los tokens ataba dos decisiones que no tienen por
qué ir juntas.

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

**Los 39 pasos de `tasks.md` están completos.** No queda ninguno pendiente.

En funcionamiento: portada, catálogo con búsqueda sin acentos, filtros
combinados, ordenamiento, estados de carga/vacío/error, detalle de propiedad,
galería, mapa de ubicación, formulario de contacto, autenticación con
autorización por rol, el área privada de la cuenta —con edición de los propios
datos, favoritos y consultas guardadas— y el panel de administración completo:
indicadores, propiedades, imágenes, características, usuarios y consultas.

Cerrado con las cabeceras de seguridad y el límite de intentos, los mensajes
de confirmación, el recorrido de QA de los tres roles y la comprobación de las
seis reglas de arquitectura.

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

**El seed no toca una galería que ya tenga imágenes.** Antes la borraba entera
y la regeneraba con marcadores de `picsum`, por ser «más simple». No era más
seguro: quien subía fotografías desde el panel las perdía en la siguiente
ejecución del seed, y los archivos quedaban huérfanos en Cloudinary sin que
nada los referenciara. Ocurrió, con quince archivos. El seed siembra datos de
partida; no es dueño de lo que se añada después.

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

### Administración de consultas

`/admin/inquiries` muestra **todas**: propiedad, contacto, mensaje y fecha,
de lo más reciente a lo más antiguo, paginadas de diez en diez y con
búsqueda sobre nombre, email, texto del mensaje y título de la propiedad.

Aquí se ven también las que su autor quitó de su historial y las de
propiedades despublicadas o eliminadas. Esta pantalla es el motivo por el que
aquellos dos borrados son lógicos: sin ella, eliminar una propiedad o vaciar
el historial propio destruiría contactos comerciales.

Cada tarjeta enlaza a la **ficha de edición** de la propiedad, no a su página
pública: es donde se ve todo y se puede actuar, y funciona también con un
borrador, que públicamente responde 404. Una propiedad eliminada se nombra
sin enlace, porque no hay a dónde llevar.

El email y el teléfono son enlaces `mailto:` y `tel:`: responder es lo único
que se hace desde aquí, y no hay ningún control que editar.

El nombre y el email son los que se escribieron en el formulario, que no
tienen por qué coincidir con los de la cuenta. Cuando hay cuenta y difieren,
se dicen los dos.

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

### Responsive y accesibilidad

Revisado contra las Web Interface Guidelines. Sin antipatrones: ni
`user-scalable=no`, ni `transition: all`, ni `outline-none`, ni manejadores
de clic sobre `div`.

Lo que faltaba y se añadió:

- `overscroll-contain` en el diálogo modal. Sin él, seguir desplazando al
  llegar al final movía la página de detrás, que se supone inerte.
- Enlace de salto al contenido en el **panel**. El portal público ya lo
  tenía; el panel pone seis enlaces por delante del contenido en cada
  página.
- Márgenes de área segura en la barra lateral fija y en el pie. En un
  teléfono en horizontal, la muesca se come el primer centímetro.
- `line-clamp-2` en el título de la tarjeta: uno largo escrito desde el
  panel empujaba el precio fuera.

**Los nombres de las utilidades de Tailwind no se escriben en los
comentarios.** Tailwind escanea el archivo entero y no distingue un
comentario de una clase: un ejemplo abreviado como `pl-[env(...)]` generaba
CSS inválido y tumbaba el sitio entero.

Verificado sobre el HTML servido de once páginas: un solo `h1` por página,
sin saltos de nivel de encabezado, ninguna imagen sin texto alternativo,
ningún botón sin nombre accesible y ningún campo sin etiqueta. Y sin
desbordamiento horizontal a 375, 768 ni 1440 píxeles.

### Rendimiento

Las consultas piden **columnas concretas**, no la fila entera. Con `include`,
cada tarjeta del catálogo arrastraba la descripción, la dirección y
`search_text` —que duplica todo lo anterior— sin mostrar ninguna de las tres:
19,9 kB por página de doce frente a 7,4 kB. Si un `select` se queda corto, el
mapeador no compila; ese es el seguro.

Las imágenes de Cloudinary se piden **ya redimensionadas**, con `f_auto`,
`q_auto` y `c_limit`, mediante un cargador propio de `next/image`. Sin él, el
optimizador de Next se descargaba el original para reescalarlo aquí. Medido
sobre una fotografía real: 1 MB frente a 50 kB en WebP.

`c_limit` reduce pero nunca amplía: una foto subida a 800 px no se estira a
1200 y se ve borrosa.

El resto de las imágenes —el hero y los marcadores del seed— sigue pasando
por el optimizador de Next. La distinción importa: al fijar un cargador
propio, Next deja de optimizar y sirve tal cual lo que se le devuelva.

Las cargas que piden dos partes de la misma página van en `cache` de React:
la sesión, los favoritos y la propiedad de la ficha. Comprobado en el log del
backend: una visita al catálogo hace cuatro llamadas, todas distintas.

Las consultas de PostgreSQL se revisaron con `EXPLAIN ANALYZE`. Con el
volumen actual el planificador elige barridos secuenciales y tarda
centésimas de milisegundo: añadir índices ahí sería más lento, no más
rápido. Los índices por ubicación y por estado ya están declarados para
cuando el catálogo crezca.

### SEO y metadata

La ficha de cada propiedad genera la suya con `generateMetadata`: título,
descripción, canónica, Open Graph y tarjeta de Twitter. La descripción
empieza por **precio y ubicación** —lo que decide si alguien entra desde un
resultado— y se recorta por palabra entera a 160 caracteres, que es lo que
muestra un buscador.

La imagen compartida es la **portada** de la propiedad. Si no tiene ninguna,
no se declara `images` en vez de poner un marcador: la tarjeta se ve mejor
sin imagen que con una que no es de la propiedad.

`metadataBase` sale de `SITE_URL`, sin prefijo público: solo la lee el
servidor. Open Graph exige direcciones
absolutas, y una URL mal escrita no tumba el renderizado: se avisa por el log
y se cae en `localhost`.

La carga de la propiedad va envuelta en `cache` de React: la piden la
metadata y la página, y sin eso serían dos llamadas idénticas a la API por
visita. Comprobado en el log del backend: una sola.

`/account*` y `/admin*` se declaran **noindex**. Un 404 no necesita marcarse:
cuando la página llama a `notFound()`, Next descarta la metadata del segmento
y ya lo marca por su cuenta.

### Paginación del catálogo

Nueve por página, que es lo que llena tres filas de la rejilla en escritorio.
El tamaño lo fija el servidor y **no viaja en la petición**: dejar que el
cliente lo eligiera convierte `?pageSize=100000` en una forma de pedir el
catálogo entero.

Se resuelve con `skip`/`take` en PostgreSQL, no trayendo todo y recortando
después, que es la razón misma de paginar. El recuento va en la misma ida y
vuelta que los datos, porque el portal lo necesita para saber cuántas páginas
hay.

La página vive en la URL, como la búsqueda y los filtros, y el control la
propaga: los enlaces a las demás páginas conservan búsqueda, filtros y orden.
Sin eso, la segunda página mostraría un listado distinto de la primera.

**Al reordenar o filtrar se vuelve a la primera.** Aparecieron dos defectos al
implementarlo: el formulario de filtros reenviaba `page` como campo oculto y el
selector de orden la arrastraba en su `router.push`. En ambos casos, aplicar un
filtro desde la página 2 dejaba en una página vacía si el nuevo resultado era
más corto.

El control muestra primera, anterior, una ventana de **tres páginas a cada
lado** de la actual, siguiente y última, con «…» donde hay salto. Un salto de
exactamente una página no lleva separador: «1 … 3» ocupa lo mismo que «1 2 3»
y esconde una página por nada. La aritmética vive aparte del componente, en
`page-range.ts`, para poder comprobar cada caso sin montar nada.

La página actual y los extremos no son enlaces: uno que no lleva a ninguna
parte confunde a quien navega con teclado. La actual se marca con
`aria-current`, porque el color por sí solo no lo dice.

`PropertyListDto` y `PropertyCollectionDto` son tipos distintos a propósito:
favoritos devuelve la colección entera y no debe fingir que pagina.

**Todo ordenamiento termina desempatando por `id`.** `createdAt` no basta: dos
propiedades creadas en el mismo milisegundo empatan, y ante un empate
PostgreSQL puede devolverlas en cualquier orden en cada consulta. Con
paginación eso significa que dos páginas seguidas se solapan y saltan filas.
Se vio con sesenta propiedades creadas de una vez: 47 resultados repartidos en
seis páginas, **43 distintos**. Con la clave primaria al final, el orden es
total y las páginas dejan de moverse.

No es un problema de datos de prueba: basta con publicar dos propiedades en el
mismo segundo.

### Búsqueda sin acentos

`montana` encuentra «montaña» y `nunoa` encuentra «Ñuñoa», en el catálogo, en
los filtros de ubicación y en los tres buscadores del panel.

Cada fila guarda una **copia normalizada** de los campos por los que se busca
—`search_text`, y en las propiedades además `commune_normalized`,
`city_normalized` y `region_normalized`—, y las consultas comparan contra
ella. La alternativa, `unaccent()` dentro de cada consulta, obligaba a SQL en
crudo en todos los buscadores.

La regla vive en `normalizeSearchText` (`@portal/contracts`) y se aplica dos
veces: al **guardar** cada fila y al **preparar** lo que se teclea. Si
divergieran, lo guardado y lo buscado dejarían de encontrarse.

Las columnas las escribe la aplicación, no PostgreSQL. Una columna generada
sería más difícil de olvidar, pero Prisma no las modela y cada migración
futura propondría un `ALTER` espurio que además fallaría al aplicarse.

El relleno de la migración **no** usa `unaccent`: esa extensión también toca
la puntuación —convierte «¿» en «?»— y lo rellenado no habría coincidido con
lo que escribe la aplicación. Usa `normalize(…, NFD)` y descarta las marcas
combinantes, que es exactamente lo que hace el normalizador de TypeScript.
Comprobado fila a fila: las 47 de la base coinciden.

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

### Seguridad

Auditoría del paso 34. La autorización, la validación y el manejo de secretos
ya estaban bien; lo que faltaba era el endurecimiento del transporte.

**Cabeceras.** Las declara `headers()` en el `next.config.ts` de cada
aplicación, no el middleware: así alcanzan también a los archivos estáticos y
no cuestan una ejecución por petición. El portal lleva una política de
contenido que enumera de dónde puede venir cada recurso; la API, que solo
devuelve JSON, lleva `default-src 'none'`.

`frame-ancestors 'none'` y `X-Frame-Options` van juntos a propósito: el
segundo cubre a los navegadores que no aplican el primero. Sin ellos, un marco
invisible sobre el panel convierte un clic de quien administra en una acción
que no quiso hacer.

La política admite `'unsafe-inline'` en los estilos porque Next inyecta
estilos en línea en cada página, y en desarrollo admite además
`'unsafe-eval'`, que exige la recarga en caliente. Cerrar esas dos puertas
pide un *nonce* por petición y, con él, pasar cada respuesta por el
middleware.

Los orígenes de Google Maps son más de los que sugiere el script inicial: el
mapa trae sus teselas de subdominios rotatorios de `googleapis.com` y de
`gstatic.com`, pide Roboto a Google Fonts y dibuja en un trabajador creado
desde un `blob:`. Declarar solo `maps.googleapis.com` lo dejaría a medias.

**Caché.** `jsonOk` y `jsonError` marcan `Cache-Control: no-store` en toda
respuesta de la API. Antes no llevaban ninguna instrucción, y `/api/auth/me` o
`/api/admin/users` podían quedar almacenadas en un proxy intermedio y
servirse después a otra persona. Se decide en el constructor de la respuesta,
como `deletedAt` vive en un solo sitio: lo que hay que repetir en cada archivo
nuevo es lo que se olvida.

**Intentos de autenticación.** Dos contadores sobre `/api/auth/login`, porque
protegen de cosas distintas.

| Contador | Clave | Ventana | De qué protege |
|---|---|---|---|
| Fino | IP **+ cuenta** | 5 cada 5 min | De que adivinen la contraseña de esa cuenta |
| Grueso | IP | 20 cada 5 min | De que agoten CPU y memoria |

El fino va por cuenta y no solo por IP porque **una IP no es una máquina**.
Detrás de un NAT —una oficina, un edificio, un operador móvil— salen muchas
personas por la misma dirección, y contar solo por IP hacía que quien tecleaba
mal su contraseña dejara fuera a todos sus compañeros. Comprobado: María agota
sus cinco y admin, Ana y Bruno siguen entrando desde esa misma IP; María no,
ni con la contraseña correcta, que es lo que se pretendía.

El grueso existe porque el fino, solo, se esquiva cambiando de correo en cada
intento. Y cada intento cuesta un scrypt de 16 MiB **aunque el correo no
exista**, porque se deriva un hash de descarte para no delatar qué cuentas
hay. Comprobado: rotando el correo, los veinte primeros pasan y el resto es
429.

El grueso se decide **antes de leer el cuerpo**; el fino necesita el correo,
así que va después, pero sigue estando antes del scrypt, que es lo caro.

**Solo cuentan los intentos fallidos**, y de forma literal: el limitador separa
`check` de `record`, se consulta antes de trabajar y se anota solo si las
credenciales no valían. Acertar pone a cero los dos contadores del origen. En
el registro cuentan todos, porque lo que se frena es dar de alta cuentas en
serie y la cuenta todavía no existe para usarla como clave.

El recuento vive en memoria del proceso: con varias instancias cada una lleva
la suya, lo que relaja el límite pero no lo anula. La dirección sale de
`x-forwarded-for`, que quien llame directamente al backend puede inventarse;
esto encarece el ataque más común sin pretender detener a quien rote
direcciones. Comprobado que el proxy del frontend **conserva** la cabecera del
cliente, así que detrás de un balanceador cada persona mantiene su contador.

**Tamaño del cuerpo.** La subida de imágenes rechaza por `Content-Length`
antes de leer el archivo: `request.formData()` almacena el cuerpo entero en
memoria, y comprobar el tamaño después llega tarde.

**CSRF.** No hacen falta testigos: la cookie es `SameSite=Lax` y el navegador
ve un solo origen, así que una petición desde otro sitio no la lleva. No hay
ningún `GET` que cambie estado, que es lo que `Lax` sí dejaría pasar.

Lo verificado y que ya estaba bien: los cinco endpoints ADMIN responden 401
sin sesión y 403 a un USER; favoritos y consultas responden 403 a ADMIN;
nadie puede tocar la consulta de otra persona ni alcanzar un borrador; un
campo `role` de más en `PATCH /api/auth/me` se descarta sin efecto; y ningún
secreto de `apps/api/.env` aparece en el HTML ni en los 23 paquetes de
JavaScript que sirve el navegador. El nombre de la cuenta de Cloudinary sí
aparece, pero dentro de las URL de las imágenes: es parte de cómo se sirven,
no una variable filtrada.

### QA integral

Recorrido del paso 35: **119 comprobaciones** contra la aplicación en marcha,
sin fallos. Los tres roles de punta a punta —catálogo, búsqueda sin acentos,
filtros, detalle, favoritos, consultas, el CRUD de propiedades con su
publicación y despublicación, características, usuarios, la subida y el
borrado de una imagen en Cloudinary— y la tabla de códigos: 400, 401, 403,
404, 409. Ningún 500 en el log.

**El defecto que apareció.** `PATCH /api/admin/users/{id}` esperaba
`newPassword`, pero el alta pide `password`. Enviar `password` al cambio
devolvía **200 con la contraseña intacta**: el campo desconocido se
descartaba en silencio y, si el cuerpo traía además otro cambio, había algo
que aplicar y la respuesta salía correcta. Quien administra habría comunicado
una contraseña que no funcionaba.

Ese descarte silencioso no se ha tocado, porque es lo que impide ascenderse a
ADMIN con un campo de más en `PATCH /api/auth/me`. Lo que ahora ocurre es que
`password` se rechaza con un 400 que dice cuál es el nombre correcto. La
interfaz nunca estuvo afectada: ya enviaba `newPassword`.

**Observación, no defecto.** El catálogo público no paginaba: `/api/properties`
devolvía todas las publicadas. Con doce filas no se notaba y la especificación
no lo pedía. Se añadió después, a petición del usuario (ver «Paginación del
catálogo»).

### Mensajes de confirmación

Toda acción que cambia algo lo dice: entrar y salir, el registro, el alta,
la edición y la baja de una propiedad —distinguiendo publicar de corregir—,
el alta y la edición de una cuenta, y el alta, el renombrado y la baja de una
característica.

Aparecen arriba, por encima del contenido, en las dos raíces. Se van solos a
los **cinco segundos** y se pueden cerrar antes. La cuenta atrás se detiene
con el puntero o el foco encima: un aviso que se va a media lectura no ha
informado a nadie.

La cola vive en `sessionStorage`, no en un estado de React, porque el portal
y el panel son **dos documentos distintos**: entrar como ADMIN salta de uno a
otro y cualquier cosa en memoria se perdería justo en la navegación que había
que anunciar.

Un mensaje sale de la cola cuando se **cierra**, no cuando se lee. Vaciarla al
leerla parecía natural y estaba mal: quien publica y quien pinta están en el
mismo documento en ese instante, así que el aviso se consumía en la página que
se estaba abandonando y no llegaba nunca a la siguiente. Se vio probando el
login de ADMIN en el navegador; ninguna prueba unitaria lo habría enseñado,
porque todas viven en un solo documento.

Los leen con `useSyncExternalStore`, que es la forma que tiene React de mirar
algo que cambia fuera de él. Vaciar la cola dentro de un efecto encadenaba un
render extra en cada montaje, y el linter lo señalaba con razón.

Se pintan con `role="status"`: confirman algo que la persona acaba de pedir,
así que se anuncian sin interrumpir. Un error sigue explicándose junto al
campo o al pie del formulario, que es donde está lo que hay que corregir; el
aviso de arriba es para lo que salió bien.

`success` es el único verde de la paleta: el acento es terracota y no
distingue «se guardó» de «no se pudo». Contraste comprobado en ambos temas,
el más justo 5,53.

### Cumplimiento arquitectónico

Las seis reglas del paso 36, comprobadas sobre el código y sobre el sistema en
marcha, no por lectura.

| Regla | Cómo se comprobó |
|---|---|
| Sin Server Actions | `server-reference-manifest.json` de ambas aplicaciones: **0 acciones**. Los dos `action=` que hay son rutas con `method="get"` |
| Comunicación REST | Solo dos archivos del frontend abren la red: `api-client.ts`, siempre contra `/api/*`, y `web3forms.ts` |
| PostgreSQL única | `provider = "postgresql"`, seis modelos, y ninguna dependencia de otro motor en los cuatro `package.json` |
| React no accede a la base | Ningún import, y **en caliente**: de los dos procesos de Next, solo el de `:3001` tiene conexión al 5432 |
| Permisos en el backend | 34 verbos en 22 handlers; los 27 privados con guarda, los 7 públicos por diseño. En los 27, la guarda se resuelve **antes** de cualquier trabajo |
| Integraciones externas | Cloudinary y Geocoding salen de `apps/api`; Web3Forms y Maps JS del navegador, con las dos únicas claves `NEXT_PUBLIC_` |

**El hueco que apareció.** Las dos primeras reglas se cumplían por convención
y nada las sostenía: npm iza las dependencias del monorepo a la raíz, así que
`@prisma/client` se resuelve desde `apps/web` aunque no lo declare, y un
import escrito por descuido habría compilado sin protestar.

Ahora hay dos cerrojos. `no-restricted-imports` ataja `@prisma/client`, `pg`
y cualquier ruta dentro de `apps/api`, y avisa mientras se escribe.
`architecture.test.ts` busca `"use server"` y los `fetch` sueltos, porque una
directiva no es un import y ninguna regla de ESLint la expresa. Los dos
comprobados inyectando la violación: los dos fallan como deben.

`server-only` **no** está en la lista de imports prohibidos, y no por
descuido: las guardas de página lo usan bien, para no acabar en el paquete
del navegador. Prohibirlo sería prohibir la precaución.

### Convergencia final

Paso 37: relectura completa de `spec.md` y `plan.md`, y comparación requisito
a requisito con lo que hay.

Los **21 criterios de aceptación** verificables por HTTP se comprobaron contra
la aplicación en marcha, uno por uno. Los dos restantes —responsive y
«sin errores bloqueantes»— los cubren el paso 33 y las validaciones finales.

Verificado además campo a campo: los diecisiete del formulario de propiedad,
los catorce del detalle, los nueve de la tarjeta, los siete de la consulta en
el panel, los seis indicadores, los doce parámetros del catálogo, los cinco
ordenamientos y los diez filtros. Y que la búsqueda alcanza los cinco campos
que pide la especificación, no solo el título.

**Cuatro desajustes entre los documentos y el código.** Ninguno rompía nada;
los cuatro eran el plan describiendo algo que no era.

| Desajuste | Qué se hizo |
|---|---|
| `## 23b` quedó escrita detrás de `## 24` | Movida a su sitio |
| El plan declaraba `src/stores/`, que existía **vacío** | Retirado, y escrito por qué: el estado compartido vive en la URL |
| Tres rutas REST existían sin estar declaradas | `/api/admin/overview`, `/api/favorites/ids` y `/api/properties/filter-options`, documentadas con su motivo |
| El plan listaba seis códigos HTTP; la API usa once | Tabla completa, distinguiendo 500 de 502 y de 503 |

El árbol de directorios del plan tampoco mencionaba `test-support/` ni
`generated/`. Ahora sí.

**Lo que ya estaba bien.** Las 31 rutas que el plan declara existen todas.
`.env.example` no se ha quedado atrás en ninguna de las dos aplicaciones y no
lleva ningún valor real. No queda ni un `TODO` ni un `FIXME` en el código.

### Conexiones a la base

El pool de `node-postgres` está acotado a **cinco por proceso**. Por omisión
abre diez, y el *session pooler* de Supabase admite quince en total: dos
procesos bastan para agotarlo. Cuando ocurre, la base responde
«max clients reached», la API devuelve 500 y el portal se ve roto sin que nada
esté mal en el código. Ocurrió, con 21 conexiones abiertas.

Cinco deja sitio para varias instancias —en Vercel cada una lleva su propio
pool— sin quedarse corto para las consultas simultáneas de una sola. Si el
tráfico creciera, el siguiente paso es el *Transaction pooler* (6543) para la
aplicación y el *Session* solo para migraciones, que es lo que Supabase
recomienda para entornos sin servidor.

### Despliegue

Dos proyectos de Vercel —`apps/api` y `apps/web` como *Root Directory*— y
PostgreSQL en Supabase.

**La conexión a Supabase usa el *Session pooler*** (puerto 5432). Los otros dos
caminos no sirven: la conexión directa es IPv6 salvo complemento de pago, y el
*Transaction pooler* (6543) no admite *prepared statements*, que las
migraciones de Prisma necesitan.

**`sslmode=no-verify`, y no `require`.** El pooler presenta un certificado de
la raíz propia de Supabase —`*.pooler.supabase.com` ← `Supabase Intermediate
2021 CA` ← `Supabase Root 2021 CA`—, que el sistema no conoce. node-postgres
trata `require` como `verify-full` y falla con «self-signed certificate in
certificate chain». Cifra igual; lo que no hace es verificar el certificado.

Ningún valor sirve a los tres clientes: `psql` no entiende `no-verify` y
node-postgres no acepta `require`. Manda la aplicación, así que en el `.env` va
`no-verify`; para conectarse a mano con `psql` hay que cambiarlo por `require`.

**`API_INTERNAL_URL` se hornea en el build**, porque se interpola dentro de
`next.config.ts`. Cambiarla en el panel no basta: hay que redesplegar el portal
sin caché de build.

**Los *previews* de Vercel están protegidos** y responden 401 antes de ejecutar
código. El portal llama al api desde su servidor, sin cabeceras, así que
`API_INTERNAL_URL` debe apuntar al **dominio de producción** del api. Para
llamar a un *preview* a mano se usa la cabecera `x-vercel-protection-bypass`
con un secreto de Deployment Protection.

**`SITE_URL` no lleva prefijo público** y las otras dos sí. Solo la lee el
servidor al generar la metadata; lo que llega al navegador es el resultado. Las
de Maps y Web3Forms tienen que estar en el navegador porque esos servicios se
ejecutan allí, y se protegen restringiéndolas por *referrer* y por dominio.

Comprobado en producción de punta a punta: catálogo, búsqueda sin acentos,
filtros, ficha, login, favoritos, consultas y las seis páginas del panel. La
sesión funciona entre los dos dominios sin CORS, porque la reescritura deja al
navegador viendo un solo origen y la cookie se atribuye al portal.

### Limitaciones conocidas

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
