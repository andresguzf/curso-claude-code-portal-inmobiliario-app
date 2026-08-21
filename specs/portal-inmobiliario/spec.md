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
- editar su información básica y su contraseña;
- guardar propiedades como favoritas o interesadas;
- eliminar propiedades guardadas;
- consultar sus propiedades interesadas;
- consultar propiedades por las cuales ha realizado solicitudes;
- buscar entre sus solicitudes y eliminarlas de su historial.

### ADMIN

ADMIN administra el portal; no lo usa como visitante registrado. No tiene
favoritos, no consulta propiedades y no dispone del área de cuenta: sus
propios datos y su contraseña los edita desde el panel.

Puede realizar las acciones públicas y además:

- acceder al panel administrativo;
- editar su perfil desde el panel;
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
- fecha de actualización;
- fecha de publicación.

La fecha de publicación se sella cuando la propiedad pasa a estar publicada,
y no la escribe nadie a mano. Es nula mientras la propiedad nunca haya salido
al portal, y se conserva si más tarde se despublica: registra que se publicó
ese día, aunque después se retirara. Si está publicada ahora lo responde el
estado, que es un dato distinto.

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

Debe soportar `USD`

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

ADMIN puede crear, renombrar y eliminar características desde el panel, sin
tocar el esquema ni desplegar: ampliar el vocabulario es dar de alta una fila.

El identificador se deriva del nombre y **no cambia al renombrar**: es con lo
que las propiedades quedan enlazadas, y corregir una errata no debe romper
esas referencias.

Al eliminar una característica, las propiedades que la declaraban dejan de
hacerlo y no pierden ningún otro dato. La interfaz dice a cuántas afecta antes
de confirmar.

---

## 5. Imágenes

Una propiedad puede contener múltiples imágenes.

Debe ser posible:

- subir múltiples imágenes;
- definir una imagen principal;
- ordenar imágenes;
- eliminar imágenes.

Las imágenes se almacenan en Cloudinary, en la carpeta `propiedades-claude`.

Se admiten JPG, PNG, WebP y AVIF, hasta 5 MB por archivo y 12 imágenes por
propiedad. La primera que se sube queda como principal: una propiedad sin
portada no se pintaría en el catálogo.

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

### Historial de solicitudes

Las solicitudes propias se muestran como registros, no como fichas de
propiedad: de cada una se ve la propiedad, el mensaje enviado y la fecha.

USER puede:

- buscar por título de la propiedad o por el texto de su mensaje;
- recorrer el historial paginado;
- eliminar una solicitud de su historial.

Eliminar es una acción sobre el historial propio, no sobre la solicitud: la
solicitud se conserva para ADMIN (sección 22), porque es el contacto que la
inmobiliaria debe responder y quien escribió no puede hacerlo desaparecer.

### Edición de la cuenta

USER puede editar su propia información en una página aparte:

- nombre;
- email;
- contraseña.

Requisitos:

- confirmar la contraseña actual para guardar cualquier cambio;
- rechazar un email que ya pertenezca a otra cuenta;
- nadie puede cambiarse el rol ni el estado de su cuenta: eso es de ADMIN
  (sección 21);
- la autorización se comprueba en backend.

---

## 18. Dashboard administrativo

El panel tiene su propia disposición, distinta de la del portal público: una
barra lateral colapsable con las secciones de administración y una cabecera
propia. No muestra la navegación pública, ni favoritos, ni consultas
personales, porque quien administra no las tiene.

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

### Eliminación

Eliminar una propiedad es un borrado lógico: deja de existir para el portal,
para la administración y para las listas de cualquier persona, pero la fila
se conserva.

El motivo es que una propiedad arrastra consultas, que son contactos
comerciales, y favoritos ajenos. Borrarla de verdad destruiría registros que
la inmobiliaria necesita y que quien administra no siempre sabe que existen.

Para retirar una propiedad del catálogo conservándola a la vista de la
administración está despublicarla, que es una acción distinta.

### Filtros del listado

Además de la búsqueda por texto, ADMIN puede acotar el listado por:

- rango de precio;
- estado de publicación —publicadas, borradores o ambas—;
- tipo de propiedad;
- tipo de operación;
- rango de fechas de publicación.

Son combinables entre sí y con la búsqueda, se resuelven en PostgreSQL y su
estado vive en la URL, igual que en el catálogo público: así el resultado se
puede compartir y el botón de atrás del navegador hace lo que se espera.

Se presentan en un panel lateral colapsable a la derecha del listado. A la
izquierda ya está la barra de secciones del panel, y dos barras enfrentadas
dejarían la tabla sin sitio.

El panel empieza abierto y se puede contraer; contraído indica cuántos
filtros están aplicados, para que nadie olvide que está viendo un listado
acotado.

En escritorio se contrae en horizontal, hasta quedar en una pestaña estrecha,
y el listado ocupa el ancho que deja libre. En móvil se contrae en vertical,
porque allí el panel va apilado sobre el listado y una pestaña lateral no le
devolvería espacio a nadie.

El filtro de estado es la diferencia principal con el catálogo público, que
no tiene ninguno: allí no hay borradores que distinguir.

---

## 20. Administración de imágenes

ADMIN puede:

- subir;
- eliminar;
- seleccionar imagen principal;
- modificar el orden.

Al eliminar una imagen se debe mantener sincronizado Cloudinary con PostgreSQL.

No dejar referencias huérfanas.

Primero se borra la fila y después el archivo. Al revés, si lo segundo
fallara, la ficha mostraría una imagen rota; en este orden lo peor que queda
es un archivo que nadie referencia, que cuesta almacenamiento pero no se le
aparece a nadie.

Una propiedad con imágenes siempre tiene una principal. Si se elimina la que
lo era, pasa a serlo la primera de las que quedan: sin portada, la propiedad
no se pintaría en el catálogo.

Los cambios de orden, de imagen principal y las eliminaciones se guardan al
instante, no al enviar el formulario de la propiedad. Son operaciones sobre
un archivo que ya existe, y mezclarlas con el borrador de los demás campos
haría que cancelar la edición dejara a medias algo ya subido.

---

## 21. Administración de usuarios

ADMIN puede:

- listar;
- buscar;
- consultar;
- activar/desactivar;
- modificar rol cuando corresponda;
- editar sus propios datos y su contraseña, como los de cualquier usuario.

Sobre su propia cuenta, ADMIN **no** puede:

- eliminarla;
- desactivarla;
- dejar de ser ADMIN.

El motivo es que el registro público solo crea cuentas `USER`: una
administración que se quita a sí misma el rol, se desactiva o se borra deja
el portal sin nadie que pueda administrarlo, y sin forma de recuperarlo desde
la propia aplicación.

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
