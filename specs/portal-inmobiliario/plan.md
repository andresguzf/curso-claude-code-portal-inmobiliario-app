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
│   │       ├── stores/
│   │       ├── schemas/
│   │       └── lib/            # Cliente REST, formateo, utilidades
│   │
│   └── api/                    # Backend Next.js — puerto 3001
│       ├── prisma/             # Esquema, migraciones y seed
│       └── src/
│           ├── app/api/        # Route Handlers REST
│           ├── services/       # Reglas de negocio
│           ├── repositories/   # Acceso a PostgreSQL
│           └── lib/            # Cliente Prisma, respuestas HTTP
│
└── packages/
    └── contracts/              # @portal/contracts — DTOs y enumeraciones
```

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
```

Autenticación:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Favoritos:

```text
GET    /api/favorites
POST   /api/favorites/{propertyId}
DELETE /api/favorites/{propertyId}
```

Consultas:

```text
POST /api/inquiries
```

Administración:

```text
GET    /api/admin/properties
POST   /api/admin/properties
GET    /api/admin/properties/{id}
PUT    /api/admin/properties/{id}
DELETE /api/admin/properties/{id}
```

Crear recursos REST adicionales cuando sean necesarios para:

- imágenes;
- características;
- usuarios;
- consultas.

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

Validar:

- tipo;
- tamaño;
- autorización.

La eliminación debe mantener sincronizados Cloudinary y PostgreSQL.

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

## 14. Errores

Utilizar códigos HTTP apropiados:

- 400
- 401
- 403
- 404
- 409
- 500

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

- `NEXT_PUBLIC_SITE_URL` (metadata y Open Graph);
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
