# Guía para estudiantes — Consumiendo el backend de la Pokedex

Este backend ya está publicado y listo para que construyas tu propia PWA (Progressive
Web App) tipo Pokedex sobre él. No necesitas tocar el backend: solo consumirlo.

## 1. URL base

```
https://pokedex-backend-g1ql.onrender.com
```

> Usa esta URL en la variable de entorno de tu propia app (por ejemplo
> `VITE_API_URL` si usas Vite).

**Importante — "cold start":** el backend corre en un plan gratuito que se duerme
tras ~15 minutos sin tráfico. La primera petición después de dormirse puede tardar
entre 30 y 50 segundos en responder (está "despertando"), las siguientes son
rápidas. Esto es normal: no significa que la API esté caída. Diseña tu UI para
mostrar un estado de carga que contemple esto (ver Épica 1.4 del backlog).

## 2. Explorando la API sin escribir código

Antes de programar nada, abre el Swagger interactivo en el navegador:

```
https://pokedex-backend-g1ql.onrender.com/docs
```

Ahí puedes ver todos los endpoints, sus parámetros, y probarlos con el botón
**"Try it out"** directamente desde el navegador, sin Postman ni curl.

El spec OpenAPI crudo (JSON) está en `https://pokedex-backend-g1ql.onrender.com/docs/json` por si quieres generar
tipos TypeScript automáticamente con alguna herramienta (ej. `openapi-typescript`).

## 3. Endpoints disponibles

| Método | Ruta                       | Para qué sirve                                               |
|--------|----------------------------|---------------------------------------------------------------|
| GET    | `/health`                  | Comprobar que el servicio está vivo                            |
| GET    | `/api/pokemon`             | Lista paginada de los 151 pokemon                              |
| GET    | `/api/pokemon/:idOrName`   | Detalle de un pokemon (por número o por nombre en minúsculas)  |
| GET    | `/api/types`               | Lista de los 17 tipos con cuántos pokemon tiene cada uno        |
| GET    | `/api/types/:name/pokemon` | Pokemon que pertenecen a un tipo                                |

### Query params de `/api/pokemon` y `/api/types/:name/pokemon`

| Param    | Tipo   | Default | Descripción                                   |
|----------|--------|---------|------------------------------------------------|
| `limit`  | número | 20      | Cuántos resultados por página (máximo 100)      |
| `offset` | número | 0       | Desde qué posición empezar (para paginar)       |
| `search` | texto  | —       | Solo en `/api/pokemon`: filtra por nombre        |
| `type`   | texto  | —       | Solo en `/api/pokemon`: filtra por tipo (ej. `fire`) |

## 4. Ejemplos rápidos (curl)

```bash
BASE="https://pokedex-backend-g1ql.onrender.com"

# Salud del servicio
curl "$BASE/health"

# Primeros 10 pokemon
curl "$BASE/api/pokemon?limit=10"

# Buscar por nombre
curl "$BASE/api/pokemon?search=char"

# Filtrar por tipo
curl "$BASE/api/pokemon?type=water&limit=10"

# Detalle por id o por nombre
curl "$BASE/api/pokemon/25"
curl "$BASE/api/pokemon/pikachu"

# Tipos disponibles
curl "$BASE/api/types"
```

## 5. Ejemplo en JavaScript (fetch, para tu PWA)

```js
const API_BASE = import.meta.env.VITE_API_URL; // https://pokedex-backend-g1ql.onrender.com

async function getPokemonList({ limit = 20, offset = 0, search, type } = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (search) params.set("search", search);
  if (type) params.set("type", type);

  const res = await fetch(`${API_BASE}/api/pokemon?${params}`);
  if (!res.ok) throw new Error(`Error ${res.status} al listar pokemon`);
  return res.json(); // { data: [...], meta: { total, limit, offset } }
}

async function getPokemonDetail(idOrName) {
  const res = await fetch(`${API_BASE}/api/pokemon/${idOrName}`);
  if (res.status === 404) return null; // no existe
  if (!res.ok) throw new Error(`Error ${res.status} al obtener detalle`);
  return res.json();
}

async function getTypes() {
  const res = await fetch(`${API_BASE}/api/types`);
  if (!res.ok) throw new Error(`Error ${res.status} al listar tipos`);
  return res.json(); // { data: [{ name, pokemonCount }, ...] }
}
```

## 6. Forma de las respuestas

**Lista** (`GET /api/pokemon`):

```json
{
  "data": [
    {
      "id": 1,
      "name": "bulbasaur",
      "genus": "Seed Pokémon",
      "types": ["grass", "poison"],
      "sprite": "https://...png",
      "artwork": "https://...png"
    }
  ],
  "meta": { "total": 151, "limit": 20, "offset": 0 }
}
```

**Detalle** (`GET /api/pokemon/:idOrName`):

```json
{
  "id": 25,
  "name": "pikachu",
  "genus": "Mouse Pokémon",
  "flavorText": "...",
  "height": 4,
  "weight": 60,
  "baseExperience": 112,
  "captureRate": 190,
  "types": ["electric"],
  "abilities": [{ "name": "static", "isHidden": false }],
  "stats": { "hp": 35, "attack": 55, "defense": 40, "specialAttack": 50, "specialDefense": 50, "speed": 90 },
  "sprites": { "front": "...", "back": "...", "frontShiny": "...", "artworkOfficial": "..." },
  "evolvesFrom": null,
  "evolvesTo": [{ "id": 26, "name": "raichu" }]
}
```

## 7. Errores que debes manejar

- **404** en `/api/pokemon/:idOrName` o `/api/types/:name/pokemon`: el pokemon o tipo no existe. El body trae `{ "error": "not_found", "message": "..." }`.
- **400** si mandas un `limit` fuera de rango (1-100) o parámetros inválidos.
- **Timeout / sin respuesta**: probablemente el servicio está despertando (cold start, ver sección 1). Reintenta con un pequeño backoff antes de mostrar un error real al usuario.

## 8. Por dónde empezar tu propia PWA

Usa el `BACKLOG.md` de este mismo repo como guía de historias (Épica 0 a 5). Un
orden razonable para tu primera entrega:

1. Épica 0 (setup del proyecto + cliente HTTP apuntando a esta API)
2. Épica 1 (listado + búsqueda + filtro por tipo)
3. Épica 2 (detalle + evoluciones)
4. Lo que te sobre de tiempo: Épica 3/4/5 (offline, PWA real, tests)

No necesitas pedir cambios al backend: todo lo que necesitas para una Pokedex
completa (nombres, tipos, habilidades, stats, sprites, evoluciones) ya está
disponible en estos endpoints.
