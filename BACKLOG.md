# Backlog — PWA Pokedex (consumo del backend)

Backlog de producto para el frontend (PWA) que consume la API descrita en `README.md`.
Organizado por épicas. Cada historia incluye criterios de aceptación y el/los endpoints que usa.

Convención de estimación: XS / S / M / L (relativo, no horas).

---

## Épica 0 — Setup del proyecto PWA

- **0.1 — Inicializar proyecto PWA** (S)
  Scaffolding (Vite + framework a elección: React/Preact/Svelte), manifest.json, service worker base, íconos, splash screens.
  _Criterio de aceptación:_ la app instala como PWA en Chrome/Android y muestra pantalla en blanco sin errores de consola.

- **0.2 — Cliente HTTP / capa de datos** (S)
  Wrapper fetch con base URL configurable por entorno (`VITE_API_URL`), manejo de errores HTTP y timeouts.
  _Depende de:_ ninguna ruta específica, pero debe apuntar a `GET /health` para el smoke test inicial.

- **0.3 — Variables de entorno y CORS** (XS)
  Documentar `VITE_API_URL` en `.env.example` del front; coordinar con backend el valor de `CORS_ORIGIN` en producción.

- **0.4 — Estrategia de caché offline (service worker)** (M)
  Definir qué se cachea: shell de la app (app-shell) siempre; respuestas de `/api/pokemon*` con estrategia stale-while-revalidate para que la lista/detalle funcionen offline tras la primera visita.

---

## Épica 1 — Listado de Pokémon (Pokedex principal)

- **1.1 — Grid/lista de los 150 pokemon con paginación** (M)
  Consumir `GET /api/pokemon?limit=&offset=`. Mostrar sprite, número (#001), nombre y tipos (badges) por tarjeta.
  _Criterio de aceptación:_ scroll infinito o paginación numerada; `meta.total` controla cuándo dejar de pedir más páginas.

- **1.2 — Buscador por nombre** (S)
  Input de búsqueda con debounce que usa `?search=`.
  _Criterio de aceptación:_ al escribir "char" aparecen charmander/charmeleon/charizard; estado vacío claro si no hay resultados.

- **1.3 — Filtro por tipo** (S)
  Selector múltiple/single de tipos alimentado por `GET /api/types` (incluye `pokemonCount` para mostrar cuántos hay por tipo). Al elegir un tipo, usar `?type=` en el listado o `GET /api/types/:name/pokemon`.

- **1.4 — Estados de carga, vacío y error** (S)
  Skeletons mientras carga, mensaje si `data` viene vacío, mensaje de error con reintento si falla el fetch (incluye modo offline sin red).

- **1.5 — Badge de color por tipo** (XS)
  Mapear cada nombre de tipo (fire, water, grass, ...) a una paleta de color consistente, reutilizable en lista y detalle.

---

## Épica 2 — Detalle de Pokémon

- **2.1 — Vista de detalle por id o nombre** (M)
  Ruta `/pokemon/:idOrName` → `GET /api/pokemon/:idOrName`. Mostrar artwork oficial, género (genus), texto de pokedex (flavorText), altura/peso, tipos, habilidades (marcar las ocultas) y stats base.

- **2.2 — Gráfico de stats base** (S)
  Barras o radar chart con hp/attack/defense/specialAttack/specialDefense/speed.

- **2.3 — Cadena de evolución** (M)
  Usar `evolvesFrom` / `evolvesTo` del detalle. Si `evolvesFrom` existe, link a esa ficha; si `evolvesTo` tiene elementos, mostrar tarjetas clicables hacia cada evolución (soporta ramificaciones, ej. Eevee).
  _Criterio de aceptación:_ navegar Pikachu → Raichu y viceversa sin recargar toda la app (routing client-side).

- **2.4 — Manejo de 404** (XS)
  Si `GET /api/pokemon/:idOrName` responde 404, mostrar pantalla "Pokémon no encontrado" con botón volver al listado.

- **2.5 — Compartir / deep link** (XS)
  URL de detalle debe ser compartible directamente (SSR/prerender opcional o al menos meta tags básicos vía `index.html` + manejo de ruta en el SW).

---

## Épica 3 — Navegación por tipos

- **3.1 — Página "Explorar por tipo"** (S)
  Grid de los 17 tipos (`GET /api/types`) con conteo de pokemon por tipo.

- **3.2 — Listado filtrado por tipo con paginación** (S)
  `GET /api/types/:name/pokemon?limit=&offset=`, misma tarjeta que Épica 1.

---

## Épica 4 — PWA / Offline / Performance

- **4.1 — Precarga del catálogo completo en background** (M)
  Tras el primer uso, descargar progresivamente el resto de páginas de `/api/pokemon` para habilitar búsqueda/filtrado 100% offline.

- **4.2 — Indicador de estado de conexión** (XS)
  Banner "Estás offline — mostrando datos guardados" cuando `navigator.onLine` es false o el fetch falla.

- **4.3 — Lazy loading de imágenes** (XS)
  `loading="lazy"` + placeholders para sprites/artwork, dado que son ~150-600 imágenes entre lista y detalle.

- **4.4 — Lighthouse PWA audit** (S)
  Checklist de instalabilidad, performance y accesibilidad antes de release.

---

## Épica 5 — Calidad y DX

- **5.1 — Tipos TypeScript generados/espejo de los DTOs del backend** (S)
  Definir interfaces `PokemonSummary`, `PokemonDetail`, `TypeSummary` que reflejen los schemas de `src/schemas/pokemon.ts` del backend (o generarlos desde `/docs/json`, el spec OpenAPI que expone Fastify Swagger).

- **5.2 — Tests de integración contra el backend local** (M)
  Levantar el backend (`npm run dev` del repo backend) y correr tests e2e (Playwright/Cypress) contra `/api/pokemon` real.

- **5.3 — Manejo centralizado de errores de red** (S)
  Interceptor único que distingue 404 (no encontrado), 5xx (error de servidor) y fallo de red (offline), con mensajes de usuario diferenciados.

---

## Fuera de alcance (explícitamente, por ahora)

- Autenticación/usuarios, favoritos persistentes en servidor (podría ser backlog v2, requeriría nuevo endpoint `POST/GET /api/favorites` + tabla de usuarios).
- Comparador de pokemon lado a lado.
- Soporte multi-generación (el backend solo cubre los primeros 150).
- Internacionalización de nombres/flavorText (PokeAPI trae otros idiomas, pero el seed actual solo persiste inglés).

## Referencia rápida de contrato (backend)

Ver OpenAPI completo en `GET /docs` (Swagger UI) o `GET /docs/json` (spec crudo) del backend corriendo.
