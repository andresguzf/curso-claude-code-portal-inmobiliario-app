# Tareas — Portal Inmobiliario

> Ejecutar las tareas en orden. No comenzar la siguiente hasta implementar y validar la actual.

## Fase 1 — Fundamentos

- [ ] **Paso 1 — Crear proyecto Next.js**
  - Crear proyecto con React y TypeScript.
  - Configurar estructura básica.
  - Crear `.env.example`.
  - Validar servidor de desarrollo y build.

- [ ] **Paso 2 — Layout y navegación**
  - Crear header, navegación, footer y layout.
  - Agregar diseño responsive base.
  - Navegación: Inicio, Propiedades, Comprar, Arrendar, Ingresar.

- [ ] **Paso 3 — Configurar PostgreSQL**
  - Configurar PostgreSQL.
  - Seleccionar y configurar ORM.
  - Configurar migraciones.
  - Validar conexión.

- [ ] **Paso 4 — Crear modelo de dominio**
  - User.
  - Property.
  - PropertyImage.
  - Feature.
  - Favorite.
  - Inquiry.
  - Crear relaciones y constraints.
  - Ejecutar migraciones.

- [ ] **Paso 5 — Crear seed**
  - Propiedades realistas de venta y arriendo.
  - Casas, departamentos, terrenos y oficinas.
  - Diferentes comunas, precios y características.

## Fase 2 — Portal público

- [ ] **Paso 6 — API REST pública de propiedades**
  - `GET /api/properties`.
  - `GET /api/properties/{id}`.
  - Mostrar públicamente solo propiedades publicadas.
  - Separar API, servicios y persistencia.

- [ ] **Paso 7 — Landing page**
  - Hero.
  - Buscador.
  - Propiedades destacadas.
  - Secciones comprar y arrendar.
  - Llamadas a la acción.

- [ ] **Paso 8 — PropertyCard y grid responsive**
  - Crear componente reutilizable.
  - Imagen, título, precio, operación, ubicación, dormitorios, baños y superficie.
  - Crear grid responsive.

- [ ] **Paso 9 — Catálogo**
  - Crear `/properties`.
  - Consumir API REST.
  - Mostrar propiedades publicadas.

- [ ] **Paso 10 — Búsqueda**
  - Búsqueda textual.
  - Título, comuna, ciudad, región y descripción.
  - Reflejar búsqueda en query parameters.

- [ ] **Paso 11 — Filtros**
  - Venta/arriendo.
  - Tipo.
  - Rango de precio.
  - Dormitorios.
  - Baños.
  - Superficie mínima.
  - Comuna/ciudad/región.
  - Permitir filtros combinados.

- [ ] **Paso 12 — Ordenamiento y estados**
  - Más recientes.
  - Precio ascendente/descendente.
  - Superficie ascendente/descendente.
  - Loading, vacío y error.
  - Skeletons cuando aporten valor.

- [ ] **Paso 13 — Detalle de propiedad**
  - Crear `/properties/{id}`.
  - Mostrar información completa.
  - Consumir exclusivamente API REST.

- [ ] **Paso 14 — Galería**
  - Imagen principal.
  - Miniaturas.
  - Navegación.
  - Responsive.

- [ ] **Paso 15 — Google Maps**
  - Construir ubicación desde dirección, comuna, ciudad y región.
  - Integrar Google Maps.
  - No solicitar latitud/longitud manual.

- [ ] **Paso 16 — Contacto con Web3Forms**
  - Formulario de contacto.
  - Incluir ID/título de propiedad.
  - Estados enviando/éxito/error.
  - Validar datos.

## Fase 3 — Autenticación y usuario

- [ ] **Paso 17 — Registro y login REST**
  - Registro.
  - Login.
  - Logout.
  - Endpoint de usuario actual.
  - Hashing seguro.

- [ ] **Paso 18 — Autorización USER y ADMIN**
  - Crear roles.
  - Proteger APIs.
  - Proteger páginas.
  - Aplicar permisos en backend.

- [ ] **Paso 19 — Cuenta de usuario**
  - Crear `/account`.
  - Mostrar información básica.
  - Preparar secciones de propiedades interesadas y consultadas.

- [ ] **Paso 20 — Favoritos**
  - Listar.
  - Agregar.
  - Eliminar.
  - Evitar duplicados.
  - Integrar en interfaz.

- [ ] **Paso 21 — Persistir consultas**
  - Crear consulta mediante REST.
  - Persistir en PostgreSQL.
  - Asociar propiedad.
  - Asociar usuario cuando exista.
  - Integrar envío Web3Forms.

## Fase 4 — Administración

- [ ] **Paso 22 — Dashboard ADMIN**
  - Crear `/admin`.
  - Mostrar indicadores.
  - Restringir a ADMIN.

- [ ] **Paso 23 — CRUD REST de propiedades**
  - Listar.
  - Crear.
  - Obtener.
  - Actualizar.
  - Eliminar.
  - Proteger endpoints.

- [ ] **Paso 24 — Interfaz de administración**
  - `/admin/properties`.
  - `/admin/properties/new`.
  - `/admin/properties/{id}/edit`.

- [ ] **Paso 25 — Formulario de propiedad**
  - Título y descripción.
  - Operación y tipo.
  - Precio.
  - Superficie útil/total.
  - Dormitorios, baños y estacionamientos.
  - Antigüedad.
  - Dirección, comuna, ciudad y región.
  - Características.
  - Publicada/destacada.
  - No agregar latitud/longitud manual.

- [ ] **Paso 26 — Subida a Cloudinary**
  - Configurar Cloudinary.
  - Crear subida segura mediante REST.
  - Validar tipo y tamaño.
  - Guardar URL y `publicId`.

- [ ] **Paso 27 — Administración de imágenes**
  - Múltiples imágenes.
  - Eliminar.
  - Seleccionar principal.
  - Ordenar.
  - Mantener sincronizados Cloudinary y PostgreSQL.

- [ ] **Paso 28 — Características**
  - Múltiples características por propiedad.
  - Modelo flexible.
  - Permitir nuevas características sin modificar columnas de Property.

- [ ] **Paso 29 — Usuarios**
  - Crear `/admin/users`.
  - Listar y buscar.
  - Activar/desactivar.
  - Modificar rol cuando corresponda.

- [ ] **Paso 30 — Consultas**
  - Crear `/admin/inquiries`.
  - Mostrar propiedad, usuario, contacto, mensaje y fecha.
  - Enlazar propiedad asociada.

## Fase 5 — Calidad y finalización

- [ ] **Paso 31 — SEO y metadata**
  - Metadata dinámica.
  - Título.
  - Descripción.
  - Open Graph.

- [ ] **Paso 32 — Optimización**
  - Optimizar imágenes Next.js/Cloudinary.
  - Evitar imágenes sobredimensionadas.
  - Revisar solicitudes duplicadas.
  - Revisar consultas PostgreSQL.

- [ ] **Paso 33 — Responsive y accesibilidad**
  - Desktop.
  - Tablet.
  - Móvil.
  - Labels, teclado, foco, alt y semántica.

- [ ] **Paso 34 — Seguridad**
  - Autenticación.
  - Autorización.
  - Validación REST.
  - Uploads.
  - Secretos.
  - Cloudinary.
  - Web3Forms.
  - Endpoints ADMIN.

- [ ] **Paso 35 — QA integral**
  - Flujos visitante.
  - Flujos USER.
  - Flujos ADMIN.
  - Errores y códigos HTTP.
  - Corregir defectos bloqueantes.

- [ ] **Paso 36 — Cumplimiento arquitectónico**
  - Confirmar que no existen Server Actions.
  - Confirmar comunicación REST.
  - Confirmar PostgreSQL.
  - Confirmar que React no accede a DB.
  - Confirmar permisos backend.
  - Confirmar integraciones externas.

- [ ] **Paso 37 — Convergencia final del SDD**
  - Releer `spec.md`.
  - Releer `plan.md`.
  - Comparar implementación con requisitos.
  - Corregir faltantes o inconsistencias.
  - Ejecutar build y validaciones finales.
  - Confirmar ausencia de errores bloqueantes.
