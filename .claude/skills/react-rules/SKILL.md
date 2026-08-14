# Skill: react-rules

**Description:** Genera un proyecto o componente React con TypeScript siguiendo las mejores prácticas actuales.

## Activation Triggers

Usar este skill cuando el usuario:
- Pida crear una aplicación React nueva
- Pida crear o modificar componentes React
- Agregue o modifique hooks, estado, formularios o lógica de UI en React

---

## Instructions

### Versión y lenguaje

- Utiliza Next.js (version más reciente disponible) + **React 19.2.8 o superior** revisar versión disponible en https://www.npmjs.com/package/react antes de scaffoldear
- Utiliza **TypeScript** en lugar de JavaScript para tipado estático, seguridad y mantenibilidad.
- Utiliza PostgreSQL como única base de datos de la aplicación.
- Utiliza API REST mediante Route Handlers de Next.js.
- No utilices Server Actions.
- Utiliza estructura monorepo

### Estado global

- Usar **Zustand** para estado global: crear un store con `create()` definiendo estado y acciones en el mismo objeto.

```ts
import { create } from "zustand";

type Store = { count: number; increment: () => void };
const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));
```

### Validación de datos

- Usar **Zod** para validar datos con esquemas (`z.object`, `z.string`, etc.).
- Validar con `.parse()` (lanza error) o `.safeParse()` (retorna `{ success, data, error }`).

### Formularios

- Integrar **Zod + React Hook Form** para formularios: usar `zodResolver` del paquete `@hookform/resolvers/zod`.

```ts
const schema = z.object({ email: z.string().email() });
const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) });
```

### Componentes

- Mantener componentes **pequeños, simples y con una sola responsabilidad**.
- Nunca mutar el estado directamente — siempre crear nuevas copias de objetos o arrays.

### useEffect

- Usar `useEffect` **solo** para sincronizar con sistemas externos (API, DOM, librerías de terceros).
- No usar `useEffect` para lógica derivada de props o estado — calcularla en el render o en handlers.
- Mantener los effects simples con dependencias explícitas y claras.

### Handlers vs Effects

- La lógica causada por interacción del usuario debe ir en **event handlers**, no en `useEffect`.
- Para comunicar cambios al padre, usar callbacks por props y ejecutarlos desde el hijo cuando corresponda.

### Custom hooks

- Extraer lógica reutilizable en **custom hooks** (`useAuth`, `useFetch`, etc.) para mantener componentes simples.
- Compartir lógica entre eventos usando funciones reutilizables o hooks, no duplicando código.

### Performance

- Usar `useMemo` para cachear cálculos costosos.
- Para reiniciar o ajustar estado: usar `key`, derivar estado desde props, o actualizar en eventos.

### Reglas de hooks

- No llamar hooks dentro de bucles, condicionales o funciones anidadas.
- Los componentes y hooks deben ser **puros** — sin side effects durante el render.

### Fetching de datos

- Usar **React Query** o **SWR** cuando el componente necesite obtener datos de una API y compartirlos entre varios componentes, aprovechando cache y refetch automático.

### Estilos y Diseño UI con Tailwind CSS

- **Clases Utilitarias**: Emplea clases utilitarias de Tailwind CSS para la maquetación y el estilizado de componentes UI.
- **Clases Condicionales Dinámicas**: Para combinar clases dinámicas o condicionales sin conflictos de especificidad o duplicados, utiliza la función de utilidad `cn` (con `clsx` y `tailwind-merge`):
  ```typescript
  import { clsx, type ClassValue } from 'clsx';
  import { twMerge } from 'tailwind-merge';

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```
- **Diseño Responsivo y Temas**: Utiliza los prefijos integrados de Tailwind (`sm:`, `md:`, `lg:`, `dark:`) para garantizar interfaces adaptables a distintos dispositivos y soporte para modo oscuro.

---

## Project Structure (referencia)

```
src/
├── components/        # Componentes UI por feature
├── hooks/             # Custom hooks reutilizables
├── stores/            # Stores Zustand
├── schemas/           # Esquemas Zod
├── types/             # Tipos TypeScript compartidos
└── lib/               # Utilidades y clientes API
```
