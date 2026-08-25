# Plan técnico — Portal Inmobiliario

## 1. Arquitectura

Next.js se utilizará como framework full stack manteniendo una arquitectura REST clara.

```text
Next.js + React
      │
    fetch()
      │
      ▼
API REST /api/**
      │
      ▼
Capa de servicios
      │
      ▼
Repositorio / ORM
      │
      ▼
PostgreSQL
```

Integraciones externas:

```text
Cloudinary  → imágenes
Google Maps → ubicación
Web3Forms   → contacto
```

## 2. Tecnologías obligatorias

- Next.js
- React
- TypeScript
- PostgreSQL
- API REST con Route Handlers de Next.js
- Cloudinary
- Google Maps
- Web3Forms

## 3. Restricciones

- No utilizar Server Actions.
- No acceder a PostgreSQL directamente desde componentes React.
- No almacenar imágenes binarias en PostgreSQL.
- No exigir latitud/longitud en el formulario ADMIN.
- No implementar funcionalidades especulativas fuera de `spec.md`.

Las dos primeras no se dejan a la buena voluntad. Prohibir un import es
trabajo de ESLint —`no-restricted-imports` en `apps/web`, contra
`@prisma/client`, `pg` y cualquier ruta dentro de `apps/api`—, porque avisa
mientras se escribe. Una directiva no es un import y ninguna regla la
expresa, así que `"use server"` lo busca una prueba que lee los archivos.

Hacía falta: npm iza las dependencias del monorepo a la raíz, de modo que
`@prisma/client` se resuelve desde `apps/web` aunque no lo declare, y un
import escrito por descuido compilaría sin protestar.

## 4. Estructura

El proyecto es un monorepo con **npm workspaces**. Frontend y backend son
aplicaciones Next.js independientes, y comparten un paquete de contratos.

```text
portal-inmobiliario/
├── apps/
│   ├── web/                    # Frontend Next.js — puerto 3000
│   │   └── src/
│   │       ├── app/            # Páginas: /, /properties, /account, /admin
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── schemas/
│   │       ├── test-support/   # Datos de ejemplo compartidos entre pruebas
│   │       └── lib/            # Cliente REST, formateo, utilidades
│   │
│   └── api/                    # Backend Next.js — puerto 3001
│       ├── prisma/             # Esquema, migraciones y seed
│       └── src/
│           ├── app/api/        # Route Handlers REST
│           ├── generated/      # Cliente de Prisma; no se edita a mano
│           ├── services/       # Reglas de negocio
│           ├── repositories/   # Acceso a PostgreSQL
│           └── lib/            # Cliente Prisma, respuestas HTTP
│
└── packages/
    └── contracts/              # @portal/contracts — DTOs y enumeraciones
```

No hay directorio de *stores*: **el estado compartido vive en la URL**. La
búsqueda, los filtros, el orden y la página son parámetros de consulta, así
que el resultado se puede compartir y el botón de atrás hace lo que se
espera. Lo demás es estado de un formulario o de un componente, y no necesita
salir de él.

### Frontera entre aplicaciones

`@portal/contracts` es la única dependencia compartida. Contiene los DTOs de
la API y el vocabulario del dominio, declarados como TypeScript plano.

El frontend **no** depende de Prisma ni del cliente generado. El backend
verifica en tiempo de compilación que las enumeraciones del contrato
coincidan con `schema.prisma`, de modo que una divergencia rompa el build en
lugar de llegar al navegador.

### Comunicación

El navegador conoce un solo origen. El frontend reescribe `/api/*` hacia el
backend mediante `rewrites` de Next.js:

```text
Navegador → :3000/api/*  ──rewrite──→  :3001/api/*
Servidor  → API_INTERNAL_URL (directo al backend)
```

Con esto no hace falta CORS, y las cookies de sesión funcionan como
same-origin sin requerir `SameSite=None`.

Adaptar cuando las convenciones actuales de Next.js lo justifiquen sin romper
la separación de responsabilidades.

## 5. Modelo de datos

Entidades:

- User
- Property
- PropertyImage
- Feature
- Favorite
- Inquiry

Relaciones:

```text
User 1 --- * Favorite * --- 1 Property
User 1 --- * Inquiry  * --- 1 Property

Property 1 --- * PropertyImage
Property * --- * Feature
```

`Inquiry.userId` puede ser nulo para permitir consultas de visitantes.

`Property.publishedAt` es nulo mientras la propiedad no haya salido nunca al
portal. Lo sella el repositorio cuando `isPublished` pasa a verdadero, y no
lo escribe el formulario: es una consecuencia de publicar, no un campo que
alguien rellene. Al despublicar se conserva, porque destruir una fecha es
destruir información y el estado ya responde aparte si está publicada ahora.

## 6. Persistencia

PostgreSQL es la única base de datos.

Seleccionar un ORM compatible con las versiones actuales de Next.js y PostgreSQL.

Requisitos:

- migraciones;
- claves foráneas;
- restricciones de unicidad;
- índices cuando estén justificados;
- seed para desarrollo.

Restricciones importantes:

- `User.email` único;
- combinación `(userId, propertyId)` única en favoritos.

## 7. API REST

Propiedades públicas:

```text
GET /api/properties
GET /api/properties/{id}
GET /api/properties/filter-options
```

`filter-options` devuelve las comunas, ciudades y regiones que existen en el
catálogo publicado. Los filtros de ubicación ofrecen lo que hay, no una lista
escrita a mano que envejece con el catálogo.

Autenticación:

```text
POST  /api/auth/register
POST  /api/auth/login
POST  /api/auth/logout
GET   /api/auth/me
PATCH /api/auth/me
```

`PATCH /api/auth/me` actualiza la cuenta de quien tiene la sesión. Solo
admite nombre, email y contraseña: el rol y el estado no se aceptan aunque
lleguen en el cuerpo.

Favoritos:

```text
GET    /api/favorites
GET    /api/favorites/ids
POST   /api/favorites/{propertyId}
DELETE /api/favorites/{propertyId}
```

`ids` devuelve solo los identificadores guardados, que es lo que necesita el
catálogo para saber qué tarjetas pintar marcadas sin traerse las propiedades
otra vez. Responde 401 sin sesión y una lista vacía con ella: son cosas
distintas, y es lo que decide si el botón de guardar llega a pintarse.

Consultas:

```text
POST   /api/inquiries
GET    /api/inquiries
DELETE /api/inquiries/{id}
```

`GET /api/inquiries` devuelve las solicitudes de quien tiene la sesión,
paginadas y filtrables por título de propiedad o texto del mensaje.

`DELETE /api/inquiries/{id}` las oculta del historial propio sin borrarlas:
siguen disponibles para ADMIN.

Administración:

```text
GET /api/admin/overview
```

Los indicadores del panel (sección 18 de la especificación) en una sola
llamada. Son seis recuentos sobre las mismas tablas: pedirlos por separado
serían seis viajes para pintar una fila de tarjetas.

```text
GET    /api/admin/properties
POST   /api/admin/properties
GET    /api/admin/properties/{id}
PUT    /api/admin/properties/{id}
DELETE /api/admin/properties/{id}
```

`GET /api/admin/properties` acepta, además de `search` y `page`, los filtros
de la sección 19 de la especificación:

```text
?minPrice=&maxPrice=&status=published|draft&type=HOUSE&operation=SALE
&publishedFrom=2026-01-01&publishedTo=2026-03-31
```

`type` y `operation` admiten varios valores repitiendo el parámetro, como en
el catálogo público. Un parámetro presente pero inválido produce un 400 en
lugar de ignorarse: devolver resultados que no corresponden al filtro pedido
es peor que rechazar la solicitud.

`DELETE` es un borrado lógico: marca la propiedad como eliminada y la retira
de todas las consultas, incluidas las de administración. Sus consultas y los
favoritos ajenos sobreviven.

Características disponibles, para el formulario de propiedad:

```text
GET /api/admin/features
```

Vive bajo `/admin` porque solo la administración necesita la lista completa:
el catálogo público muestra las características de cada propiedad, no el
vocabulario entero.

```text
POST   /api/admin/features
PATCH  /api/admin/features/{id}
DELETE /api/admin/features/{id}
```

`POST` deriva el identificador del nombre; `PATCH` cambia solo el nombre y
deja el identificador quieto, porque es con lo que las propiedades quedan
enlazadas. Un nombre repetido responde 409 y dice cuál choca, en lugar de
dejar reventar la restricción de unicidad con un 500.

El listado acompaña cada característica de cuántas propiedades la usan: es lo
que permite advertir, antes de eliminarla, a cuántas fichas va a afectar.

Usuarios:

```text
GET   /api/admin/users
POST  /api/admin/users
GET   /api/admin/users/{id}
PATCH /api/admin/users/{id}
```

`GET` admite búsqueda por nombre o email y filtros por rol y estado. `PATCH`
cambia nombre, email, contraseña, rol o estado: lo que no viaja no se toca.

`POST` da de alta una cuenta con la contraseña inicial que se le fije, y
admite rol `USER` o `ADMIN`. Es la única vía dentro de la aplicación para
crear un segundo `ADMIN`; el registro público solo crea `USER`. Un email
repetido responde 409, igual que en el registro.

Quién hace la petición sale de la **sesión**, nunca del cuerpo. Es lo que
hace imposible saltarse las reglas de la sección 21 de la especificación
diciendo ser otra persona: sobre la propia cuenta, desactivarse o dejar de
ser ADMIN responden 403.

A diferencia de `PATCH /api/auth/me`, aquí no se pide la contraseña actual:
quien administra no la conoce. Es la contrapartida del rol.

Consultas:

```text
GET /api/admin/inquiries
```

Devuelve **todas**, de más reciente a más antigua, paginadas y con búsqueda
sobre nombre, email, texto del mensaje y título de la propiedad.

Sin filtro por `hiddenByUserAt` ni por el estado de la propiedad: aquí se ven
también las que su autor quitó de su historial y las de propiedades
despublicadas o eliminadas. Es lo contrario del historial propio, y el motivo
por el que ambos borrados son lógicos.

El formulario las ofrece como casillas y el backend rechaza con 400 un
identificador que no exista, en lugar de dejar que el ORM falle al conectarlo
y responder un 500 sin explicación.

Crear recursos REST adicionales cuando sean necesarios para:

- imágenes;
- características;
- usuarios;
- consultas.

## 7b. Mensajes de confirmación

Viven enteros en el navegador. No hay Server Actions y ninguna de estas
acciones vuelve a pintar la página desde el servidor: el formulario llama a
la API, y si sale bien navega.

La cola está en `sessionStorage`, no en un estado de React. El portal y el
panel son **dos raíces distintas**, cada una con su `<html>`: entrar como
ADMIN lleva de un documento al otro, y cualquier cosa guardada en memoria se
perdería justo en la navegación que había que anunciar. En `sessionStorage`
sobrevive, y muere al cerrar la pestaña, que es exactamente lo que dura un
aviso.

Publicar un mensaje escribe en la cola y lanza un evento de `window`. El
componente que los pinta vacía la cola al montarse —eso cubre las
navegaciones que recargan el documento— y también al recibir el evento —eso
cubre las que no—. Una sola vía para los dos casos.

Se pintan con `role="status"`, para que un lector de pantalla los anuncie sin
interrumpir. La cuenta atrás de cinco segundos se detiene con el puntero o el
foco encima.

## 8. Responsabilidades

### Route Handlers

- recibir y analizar HTTP;
- validar entrada básica;
- invocar servicios;
- devolver respuestas HTTP.

### Servicios

- lógica de aplicación;
- reglas de negocio;
- coordinación de persistencia e integraciones.

### Repositorios / ORM

- persistencia;
- consultas a PostgreSQL;
- sin lógica de presentación.

### React

- interfaz;
- interacción;
- estado visual;
- consumo de REST;
- sin acceso directo a base de datos.

## 9. Búsqueda y filtros

`GET /api/properties` debe soportar parámetros como:

```text
search
operation
type
minPrice
maxPrice
bedrooms
bathrooms
minUsableArea
commune
city
region
sort
```

El filtrado y ordenamiento debe ejecutarse principalmente en PostgreSQL y no cargando todo el catálogo en el navegador.

### Sin acentos

Cada fila guarda una copia normalizada de los campos por los que se busca
—`search_text`, y en `Property` además `commune_normalized`,
`city_normalized` y `region_normalized`—, y las consultas comparan contra
ella. Así «montana» encuentra «montaña» sin SQL en crudo en cada buscador.

La regla es `normalizeSearchText` de `@portal/contracts`, y se aplica en dos
sitios que tienen que coincidir: al escribir la fila y al leer lo que se
teclea. Vive en el contrato compartido justamente por eso.

Las columnas las mantiene la aplicación, en los repositorios, junto a las
columnas de las que derivan. Una columna generada por PostgreSQL sería más
difícil de olvidar, pero Prisma no las modela: cada migración posterior
propondría un `ALTER` espurio que además fallaría al aplicarse.

El relleno inicial de la migración reproduce el mismo algoritmo con
`normalize(…, NFD)` y descartando las marcas combinantes. No usa `unaccent`
porque esa extensión toca también la puntuación, y entonces lo rellenado y lo
que escribe la aplicación dejarían de coincidir.

## 10. Autenticación y autorización

Utilizar un mecanismo seguro compatible con la API REST.

Requisitos:

- hashing de contraseñas;
- almacenamiento seguro de sesión/token;
- autorización en servidor;
- no almacenar tokens sensibles en `localStorage`;
- usuarios inactivos no pueden autenticarse;
- endpoints ADMIN requieren ADMIN;
- endpoints privados USER requieren autenticación.

## 10b. Endurecimiento

Cuatro medidas, todas en el servidor.

**Cabeceras de seguridad.** Las declara `headers()` en el `next.config.ts` de
cada aplicación. Van en las dos porque el navegador solo ve el frontend, pero
el backend es alcanzable por su cuenta en un despliegue donde comparta red.

| Cabecera | Por qué |
|---|---|
| `Content-Security-Policy` | Acota de dónde puede salir un script, un estilo o una imagen |
| `X-Frame-Options: DENY` | Para los navegadores que no aplican `frame-ancestors` |
| `X-Content-Type-Options: nosniff` | Impide que un archivo se ejecute como algo que no declara |
| `Referrer-Policy` | Una URL privada no viaja al salir del sitio |
| `Permissions-Policy` | Cámara, micrófono y geolocalización quedan denegadas |
| `Strict-Transport-Security` | Solo en producción: en local no hay `https` |

La política admite `'unsafe-inline'` en los estilos porque Next inyecta
estilos en línea, y en desarrollo admite además `'unsafe-eval'`, que necesita
la recarga en caliente. Cerrar esas dos puertas exige un *nonce* por petición
y, con él, pasar cada respuesta por el middleware.

**Caché de las respuestas privadas.** `jsonOk` y `jsonError` marcan
`Cache-Control: no-store` en toda respuesta de la API. Es la opción segura por
omisión: hoy ningún endpoint es cacheable —todos declaran `force-dynamic`—, y
poner la instrucción en el constructor de la respuesta evita tener que
acordarse en cada endpoint nuevo.

**Límite de intentos de autenticación.** Dos contadores sobre
`/api/auth/login`, porque protegen de cosas distintas.

| Contador | Clave | Ventana | De qué protege |
|---|---|---|---|
| Fino | IP **+ cuenta** | 5 cada 5 min | De que adivinen la contraseña de esa cuenta |
| Grueso | IP | 20 cada 5 min | De que agoten CPU y memoria del servidor |

El fino es el que importa para quien usa el portal, y va por cuenta y no solo
por IP por una razón concreta: una IP no es una máquina. Detrás de un NAT
—una oficina, un edificio, un operador móvil— salen muchas personas por la
misma dirección, y contar solo por IP hace que quien teclea mal su contraseña
deje fuera a todos sus compañeros, administración incluida.

El grueso existe porque el fino, solo, se esquiva: basta cambiar de correo en
cada intento para estrenar contador. Y cada intento cuesta un scrypt de
16 MiB aunque el correo no exista, porque se deriva un hash de descarte para
no delatar qué cuentas hay. Sin un tope por IP, rotar correos agota el
servidor.

El grueso se comprueba **antes de leer el cuerpo**; el fino necesita el
correo, así que va después, pero sigue estando antes del scrypt, que es lo
caro.

**Solo cuentan los intentos fallidos.** El limitador separa consultar de
anotar: se consulta antes de trabajar y se anota solo si las credenciales no
valían. Entrar bien además pone a cero los dos contadores de ese origen.

`/api/auth/register` mantiene su contador por IP —cinco cada quince minutos—
y ahí sí cuentan todos los intentos: lo que se frena es dar de alta cuentas en
serie, y una que se crea sin problemas es justo el caso a frenar.

El estado vive en memoria del proceso: con varias instancias cada una lleva su
cuenta, lo que relaja el límite pero no lo anula. Un almacén compartido es la
evolución natural cuando haya más de un proceso.

**Tamaño del cuerpo.** La subida de imágenes rechaza por `Content-Length`
antes de leer el archivo. `request.formData()` almacena el cuerpo entero en
memoria, así que comprobar el tamaño después de leerlo llega tarde.

## 11. Cloudinary

Flujo:

```text
ADMIN
  │
selecciona archivo
  │
  ▼
API REST
  │
  ▼
Cloudinary
  │
 URL + publicId
  │
  ▼
PostgreSQL
```

Endpoint:

```text
POST /api/admin/properties/{id}/images
```

El cuerpo es `multipart/form-data` con un campo `file`, porque lo que viaja
es un archivo y no un JSON. Devuelve la imagen ya guardada: `url`, `publicId`,
posición e indicador de principal.

El archivo pasa por la API camino de Cloudinary en vez de ir directo desde el
navegador: la firma exige el secreto de la cuenta, y ese secreto no sale del
servidor.

Se habla con la API REST de Cloudinary directamente, sin su SDK: la operación
son dos llamadas y una firma SHA-1. Es el mismo criterio que con Geocoding y
Web3Forms.

Las imágenes aterrizan todas en la carpeta `propiedades-claude`. Tenerlas
agrupadas permite revisarlas o borrarlas en bloque sin tocar el resto de la
cuenta.

Validar:

- tipo —solo JPG, PNG, WebP y AVIF: `image/svg+xml` también es una imagen y
  admite scripts—;
- tamaño;
- autorización.

El tipo y el tamaño se comprueban **antes** de subir: al revés, un archivo
rechazado habría gastado igualmente una llamada a Cloudinary. El tipo lo
declara el navegador, así que esta es la primera barrera y no la única;
Cloudinary rechaza por su cuenta lo que no sea una imagen.

Códigos: 400 para un formato inadmisible, 413 para el exceso de tamaño, 404
si la propiedad no existe, 503 si el entorno no tiene credenciales y 502 si
Cloudinary falla. Los dos últimos son distintos a propósito: uno no tiene
nada que reintentar y el otro sí.

Si la subida sale bien pero la fila no llega a guardarse, se elimina el
recurso recién subido: quedaría un archivo que nada referencia y que nadie
sabría que sobra.

Administración de las imágenes ya subidas:

```text
PUT    /api/admin/properties/{id}/images          (orden definitivo)
PATCH  /api/admin/properties/{id}/images/{imageId} (marcar principal)
DELETE /api/admin/properties/{id}/images/{imageId}
```

`PUT` recibe la lista completa de identificadores en el orden deseado, como
el `PUT` de la propiedad recibe la lista definitiva de características: una
lista parcial dejaría posiciones a medias.

La eliminación debe mantener sincronizados Cloudinary y PostgreSQL. El orden
es **primero la fila y después el archivo**: al revés, un fallo en el segundo
paso dejaría una imagen rota en la ficha, mientras que así lo peor que queda
es un archivo huérfano, que cuesta almacenamiento pero no se le aparece a
nadie.

Las escrituras que tocan varias filas —reordenar, cambiar la principal,
promover una nueva principal al eliminar— van en una transacción: a medio
hacer dejarían dos imágenes principales o dos en la misma posición.

## 12. Google Maps

Construir la ubicación utilizando:

- dirección;
- comuna;
- ciudad;
- región;
- país.

No solicitar coordenadas manuales.

Si posteriormente se requiere geocodificación interna, debe ser transparente para ADMIN y no modificar los campos obligatorios del formulario.

### Reparto entre servidor y navegador

La integración se resuelve en dos tramos, cada uno con su clave:

```text
Backend   → Geocoding API  → latitud/longitud a partir de la dirección
Navegador → Maps JavaScript API → mapa interactivo en esas coordenadas
```

La geocodificación ocurre en el servidor porque su clave es un secreto y
porque así ADMIN nunca ve ni escribe coordenadas. El resultado se guarda en
memoria mientras la dirección no cambie, para no repetir la consulta —y el
consumo de cuota— en cada visita a la ficha.

El mapa se dibuja en el navegador, que es donde vive el Maps JavaScript API.
Su clave es distinta de la del servidor y pública por diseño: viaja en el
HTML, y su protección no es el secreto sino la restricción por *referrer*
configurada en Google Cloud.

## 13. Web3Forms

Flujo:

1. validar datos;
2. identificar propiedad;
3. identificar usuario autenticado cuando exista;
4. persistir consulta;
5. enviar mediante Web3Forms;
6. devolver una respuesta REST consistente.

Definir un comportamiento claro ante fallos para evitar perder silenciosamente una consulta.

### Reparto entre servidor y navegador

Web3Forms solo acepta envíos desde el navegador en su plan gratuito: una
petición desde el servidor responde `403` con «Use our API in client side».
El flujo se reparte en consecuencia:

```text
Navegador → POST /api/inquiries → validación y persistencia
Navegador → api.web3forms.com   → correo a la inmobiliaria
```

La API se consulta primero, porque la validación del servidor es la que
manda y no debe salir un correo por una consulta que el backend rechaza.

Su clave de acceso es pública por diseño —Web3Forms la publica en el HTML de
cada formulario que la usa— y por eso vive en `apps/web/.env`. No da acceso a
ninguna cuenta: solo permite enviar al correo configurado.

## 13b. SEO y metadata

La ficha de cada propiedad genera su metadata con `generateMetadata`: título,
descripción, canónica y Open Graph con la imagen de portada. La descripción
empieza por precio y ubicación —lo que decide si alguien entra desde un
resultado de búsqueda— y se recorta por palabra entera a 160 caracteres.

`metadataBase` sale de `SITE_URL`, **sin** prefijo público: solo la lee el
servidor al generar las etiquetas, y lo que llega al navegador es el
resultado, no la variable. Open Graph exige direcciones
absolutas: una imagen relativa no la resuelve el servidor que lee la etiqueta
al compartir el enlace.

La carga de la propiedad va envuelta en `cache` de React porque la piden dos
veces por visita —la metadata y el contenido—; sin eso serían dos llamadas
idénticas a la API.

El área de cuenta y el panel de administración se declaran `noindex`. Están
tras autenticación, así que un buscador no vería su contenido, pero sí podría
listar sus direcciones.

## 13c. Rendimiento

Las consultas piden columnas concretas, nunca la fila entera. Con `include`,
el catálogo arrastraba la descripción, la dirección y el texto de búsqueda
—una copia de todo lo anterior— que ninguna tarjeta muestra: 19,9 kB por
página de doce frente a 7,4 kB.

Las imágenes de Cloudinary se piden ya redimensionadas y en el formato que
admita el navegador, mediante un cargador propio de `next/image`. Sin él, el
optimizador de Next descargaba el original —un megabyte— para reescalarlo en
nuestro servidor. Medido sobre una fotografía real: 1 MB frente a 50 kB.

El resto de las imágenes sigue pasando por el optimizador de Next. La
distinción es necesaria: al fijar un cargador propio, Next deja de optimizar
y sirve tal cual lo que se le devuelva.

Las cargas que necesitan dos partes de la misma página van envueltas en
`cache` de React: la sesión, los favoritos y la propiedad de la ficha. Una
visita al catálogo hace cuatro llamadas a la API, todas distintas.

## 14. Errores

Utilizar códigos HTTP apropiados:

| Código | Cuándo |
|---|---|
| 200 · 201 | Correcto; `201` cuando se crea un recurso |
| 400 | El cuerpo o un parámetro no valen, y se dice cuál |
| 401 | No hay sesión: se resuelve entrando |
| 403 | Hay sesión y no basta: entrar otra vez no arregla nada |
| 404 | No existe —o no existe **para quien pregunta**: un borrador responde lo mismo que una propiedad inventada— |
| 409 | Choca con algo que ya está: un email o un nombre repetido |
| 413 | El archivo excede lo admitido |
| 429 | Se agotaron los intentos de la ventana; lleva `Retry-After` |
| 500 | Fallo inesperado; la causa queda en el log, no en la respuesta |
| 502 | Un servicio externo falló y reintentar puede servir |
| 503 | Una integración no está configurada en este entorno; reintentar no sirve |

Los tres últimos son distintos a propósito. Un 500 es culpa nuestra, un 502
es de Cloudinary o de Google, y un 503 dice que falta una credencial: cada
uno se atiende de otra manera.

Formato recomendado:

```json
{
  "message": "Propiedad no encontrada",
  "status": 404
}
```

No exponer stack traces internos.

## 15. Variables de entorno

Cada aplicación tiene su propio `.env`, porque Next.js solo lee variables
desde el directorio de la aplicación.

`apps/api/.env` — ninguna de estas variables llega al navegador:

- conexión PostgreSQL;
- secretos de autenticación;
- credenciales Cloudinary;
- clave de geocodificación de Google Maps.

`apps/web/.env`:

- `SITE_URL` (metadata y Open Graph; solo servidor);
- `API_INTERNAL_URL` (destino del proxy hacia el backend);
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (mapa del detalle);
- `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` (formulario de contacto).

Ambas llegan al navegador porque los servicios que las usan se ejecutan allí:
el Maps JavaScript API dibuja el mapa y Web3Forms rechaza los envíos desde el
servidor. Se protegen restringiéndolas —por *referrer* y por API en Google
Cloud, por dominio en Web3Forms—, no ocultándolas. El prefijo `NEXT_PUBLIC_`
deja constancia explícita de que son públicas; el resto de credenciales sigue
sin salir de `apps/api`.

Crear un `.env.example` por aplicación, sin secretos reales.

## 16. Validación

Como mínimo validar:

- build;
- migraciones;
- endpoints REST;
- autenticación;
- autorización;
- filtros;
- favoritos;
- consultas;
- subida/eliminación Cloudinary;
- CRUD ADMIN;
- comportamiento responsive.

## 17. Definición de terminado

Una tarea está terminada cuando:

- cumple `spec.md`;
- respeta este plan;
- el build pasa;
- las validaciones correspondientes pasan;
- no quedan errores bloqueantes;
- su checkbox se actualiza en `tasks.md`.
