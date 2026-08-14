# Especificación del producto — Portal Inmobiliario

## 1. Visión del producto

Construir un portal inmobiliario full stack orientado inicialmente al mercado chileno.

Los visitantes podrán descubrir propiedades en venta o arriendo, buscarlas y filtrarlas, consultar su información completa, visualizar fotografías y una ubicación aproximada en el mapa, y solicitar información sobre una propiedad.

Los usuarios registrados podrán guardar propiedades de interés y consultar las propiedades por las cuales han realizado solicitudes.

Los administradores podrán gestionar el portal desde un área privada de administración.

---

## 2. Tipos de usuario

### Visitante

Puede:

- acceder a la landing page;
- navegar por propiedades publicadas;
- buscar propiedades;
- aplicar filtros;
- ordenar resultados;
- consultar el detalle de una propiedad;
- visualizar la galería;
- consultar características;
- visualizar la ubicación mediante Google Maps;
- enviar una solicitud de información;
- registrarse;
- iniciar sesión.

### USER

Puede realizar todas las acciones públicas y además:

- cerrar sesión;
- acceder a su cuenta;
- guardar propiedades como favoritas o interesadas;
- eliminar propiedades guardadas;
- consultar sus propiedades interesadas;
- consultar propiedades por las cuales ha realizado solicitudes.

### ADMIN

Puede realizar las acciones anteriores y además:

- acceder al panel administrativo;
- crear propiedades;
- editar propiedades;
- eliminar propiedades;
- publicar y despublicar propiedades;
- marcar propiedades como destacadas;
- administrar imágenes;
- administrar características;
- administrar usuarios;
- revisar solicitudes de información.

---

## 3. Información de una propiedad

Cada propiedad debe soportar como mínimo:

- título;
- descripción;
- tipo de operación;
- tipo de propiedad;
- precio;
- moneda;
- metros cuadrados útiles;
- metros cuadrados totales;
- número de dormitorios;
- número de baños;
- número de estacionamientos;
- antigüedad;
- dirección;
- comuna;
- ciudad;
- región;
- estado de publicación;
- indicador de propiedad destacada;
- fecha de creación;
- fecha de actualización.

### Tipo de operación

Valores:

- `SALE`
- `RENT`

### Tipo de propiedad

Valores iniciales:

- `HOUSE`
- `APARTMENT`
- `LAND`
- `OFFICE`
- `COMMERCIAL`
- `OTHER`

### Moneda

Debe soportar al menos:

- `CLP`
- `UF`
- `USD`

Algunos campos podrán ser opcionales cuando no correspondan al tipo de propiedad.

---

## 4. Características del inmueble

Las características deben modelarse de forma flexible.

Ejemplos:

- piscina;
- gimnasio;
- quincho;
- lavandería;
- jardín;
- terraza;
- bodega;
- ascensor;
- conserjería;
- seguridad;
- calefacción;
- aire acondicionado;
- pet friendly.

No crear una columna booleana en `Property` para cada característica.

Una propiedad puede tener múltiples características y una característica puede pertenecer a múltiples propiedades.

---

## 5. Imágenes

Una propiedad puede contener múltiples imágenes.

Debe ser posible:

- subir múltiples imágenes;
- definir una imagen principal;
- ordenar imágenes;
- eliminar imágenes.

Las imágenes se almacenan en Cloudinary.

PostgreSQL almacena solamente la información necesaria para relacionarlas y administrarlas:

- URL;
- `publicId` de Cloudinary;
- posición;
- indicador de imagen principal.

---

## 6. Ubicación

El administrador no debe ingresar latitud ni longitud manualmente.

El formulario utiliza:

- dirección;
- comuna;
- ciudad;
- región.

Ejemplo:

```text
Av. Apoquindo 3000
Las Condes
Santiago
Región Metropolitana
```

La aplicación construirá una dirección completa utilizable por Google Maps.

```text
Av. Apoquindo 3000, Las Condes, Santiago, Región Metropolitana, Chile
```

La ubicación mostrada públicamente puede ser aproximada cuando corresponda.

Latitud y longitud no deben ser campos obligatorios del formulario administrativo.

---

## 7. Landing page

Debe incluir:

- header;
- navegación;
- hero;
- buscador principal;
- propiedades destacadas;
- propiedades en venta;
- propiedades en arriendo;
- llamadas a la acción;
- footer.

Navegación pública inicial:

- Inicio
- Propiedades
- Comprar
- Arrendar
- Ingresar

---

## 8. Catálogo

El catálogo debe:

- mostrar únicamente propiedades publicadas;
- utilizar un grid responsive;
- utilizar tarjetas reutilizables;
- contemplar estados de carga, vacío y error.

Cada tarjeta mostrará, cuando corresponda:

- imagen principal;
- título;
- precio;
- operación;
- tipo;
- comuna o ubicación;
- dormitorios;
- baños;
- superficie útil.

---

## 9. Búsqueda

Permitir búsqueda textual sobre información relevante:

- título;
- comuna;
- ciudad;
- región;
- descripción.

La búsqueda debe quedar representada mediante parámetros de consulta.

```text
/properties?search=providencia
```

---

## 10. Filtros

Permitir combinar:

- venta/arriendo;
- tipo de propiedad;
- precio mínimo;
- precio máximo;
- dormitorios;
- baños;
- superficie útil mínima;
- comuna;
- ciudad;
- región.

Los filtros deben representarse en la URL.

```text
/properties?operation=SALE&commune=las-condes&bedrooms=3
```

---

## 11. Ordenamiento

Permitir:

- más recientes;
- precio menor a mayor;
- precio mayor a menor;
- superficie menor a mayor;
- superficie mayor a menor.

---

## 12. Detalle de propiedad

Mostrar:

- título;
- precio;
- descripción;
- operación;
- tipo;
- superficie útil;
- superficie total;
- dormitorios;
- baños;
- estacionamientos;
- antigüedad;
- características;
- galería;
- ubicación;
- formulario de contacto.

---

## 13. Google Maps

El detalle debe mostrar Google Maps utilizando la dirección textual de la propiedad.

La configuración debe manejarse mediante variables de entorno.

El administrador no necesita conocer coordenadas geográficas.

---

## 14. Contacto y solicitudes

Integrar Web3Forms.

Campos visibles:

- nombre;
- email;
- teléfono;
- mensaje.

Agregar automáticamente:

- ID de propiedad;
- título de propiedad.

Mostrar estados:

- enviando;
- enviado;
- error.

La solicitud también debe persistirse en PostgreSQL.

Si existe un usuario autenticado, relacionar la solicitud con él.

Los visitantes no autenticados también pueden realizar consultas.

---

## 15. Autenticación

Soportar:

- registro;
- login;
- logout;
- consulta del usuario autenticado.

Las contraseñas deben almacenarse mediante hashing seguro.

No almacenar información sensible de autenticación en `localStorage`.

---

## 16. Favoritos o propiedades interesadas

USER puede:

- guardar una propiedad;
- eliminarla de favoritos;
- listar sus propiedades guardadas.

No permitir duplicados para el mismo usuario y propiedad.

---

## 17. Cuenta de usuario

El área privada debe mostrar:

- información básica;
- propiedades interesadas;
- propiedades consultadas.

---

## 18. Dashboard administrativo

Mostrar indicadores como:

- total de propiedades;
- propiedades publicadas;
- propiedades en venta;
- propiedades en arriendo;
- usuarios;
- consultas.

---

## 19. Administración de propiedades

ADMIN puede:

- listar;
- buscar;
- crear;
- editar;
- eliminar;
- publicar/despublicar;
- destacar;
- administrar características;
- administrar imágenes.

Formulario:

- título;
- descripción;
- operación;
- tipo;
- precio;
- moneda;
- superficie útil;
- superficie total;
- dormitorios;
- baños;
- estacionamientos;
- antigüedad;
- dirección;
- comuna;
- ciudad;
- región;
- características;
- publicada;
- destacada.

No solicitar latitud ni longitud.

---

## 20. Administración de imágenes

ADMIN puede:

- subir;
- eliminar;
- seleccionar imagen principal;
- modificar el orden.

Al eliminar una imagen se debe mantener sincronizado Cloudinary con PostgreSQL.

No dejar referencias huérfanas.

---

## 21. Administración de usuarios

ADMIN puede:

- listar;
- buscar;
- consultar;
- activar/desactivar;
- modificar rol cuando corresponda.

La autorización siempre debe comprobarse en backend.

---

## 22. Administración de consultas

ADMIN puede revisar:

- propiedad;
- usuario asociado cuando exista;
- nombre;
- email;
- teléfono;
- mensaje;
- fecha.

Debe poder navegar desde la consulta hacia la propiedad correspondiente.

---

## 23. Responsive

La aplicación debe funcionar correctamente en:

- desktop;
- tablet;
- móvil.

Revisar especialmente:

- navegación;
- grid;
- filtros;
- tarjetas;
- galería;
- formularios;
- mapa;
- cuenta;
- administración.

---

## 24. Accesibilidad

Aplicar como mínimo:

- HTML semántico;
- labels;
- navegación mediante teclado;
- estados de foco;
- textos alternativos;
- jerarquía correcta de encabezados.

---

## 25. SEO

Las páginas públicas de propiedades deben generar metadata dinámica:

- título;
- descripción;
- Open Graph;
- imagen principal cuando corresponda.

---

## 26. Criterios de aceptación finales

El producto está funcionalmente terminado cuando:

- los visitantes pueden explorar propiedades;
- se diferencian venta y arriendo;
- funciona la búsqueda;
- funcionan filtros combinados;
- funciona el ordenamiento;
- funciona el detalle;
- funciona la galería;
- funciona Google Maps;
- funciona el contacto;
- los usuarios pueden registrarse y autenticarse;
- USER puede administrar favoritos;
- USER puede consultar propiedades contactadas;
- ADMIN puede administrar propiedades;
- ADMIN puede administrar imágenes con Cloudinary;
- ADMIN puede administrar características;
- ADMIN puede administrar usuarios;
- ADMIN puede revisar consultas;
- PostgreSQL persiste los datos;
- el frontend se comunica con el backend mediante REST;
- no se utilizan Server Actions;
- la autorización se aplica en backend;
- la aplicación es responsive;
- no existen errores bloqueantes conocidos.
