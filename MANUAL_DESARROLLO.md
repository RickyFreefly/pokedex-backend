# Manual de desarrollo — Pokedex Backend (Gen I)

Referencia técnica del backend para quien lo mantiene o extiende. Para consumirlo
desde un frontend, ver [`GUIA_ESTUDIANTES.md`](./GUIA_ESTUDIANTES.md). Para setup
rápido y scripts, ver [`README.md`](./README.md).

## 1. Arquitectura

```
src/
  app.ts            # arma la instancia Fastify (cors, swagger, rutas, error handler)
  server.ts          # entrypoint: levanta el servidor con env.PORT/HOST
  lib/
    env.ts            # valida variables de entorno con zod
    prisma.ts          # PrismaClient + adapter better-sqlite3
    pokeapi.ts          # cliente + schemas zod para PokeAPI (usado solo en el seed)
    mappers.ts          # convierte entidades Prisma -> shape de respuesta HTTP
  routes/
    health.ts, pokemon.ts, types.ts
  schemas/
    pokemon.ts          # JSON Schemas usados por Fastify para validar y alimentar Swagger
prisma/
  schema.prisma        # modelo de datos
  migrations/           # historial de migraciones SQL
  seed.ts               # descarga PokeAPI y puebla la base (ver sección 4)
prisma.config.ts       # config de Prisma 7 (datasource url, path de migraciones)
render.yaml            # blueprint de deploy en Render
```

**Flujo de una request:** Fastify valida query/params contra el JSON Schema de la
ruta → handler llama a Prisma (incluyendo relaciones necesarias) → `mappers.ts`
aplana el resultado al shape público → Fastify valida la respuesta contra el
schema y la serializa.

## 2. Modelo de datos

### `Pokemon` (151 filas, ids 1-151, gen I completa — incluye a Mew)

| Campo | Tipo | Contenido |
|---|---|---|
| `id` | Int (PK) | Número de pokedex |
| `name` | String (unique) | Nombre en inglés, minúsculas, formato PokeAPI (ej. `mr-mime`, `nidoran-f`) |
| `genus` | String? | Ej. "Seed Pokémon" |
| `flavorText` | String? | Descripción de pokedex, en inglés |
| `height` | Int | Decímetros |
| `weight` | Int | Hectogramos |
| `baseExperience` | Int? | Experiencia base al derrotarlo |
| `captureRate` | Int? | Tasa de captura (0-255) |
| `hp`, `attack`, `defense`, `specialAttack`, `specialDefense`, `speed` | Int | Las 6 stats base |
| `spriteFront`, `spriteBack`, `spriteFrontShiny`, `artworkOfficial` | String? | URLs de imágenes (CDN de PokeAPI/GitHub) |
| `evolvesFromId` → `evolvesFrom` / `evolvesTo` | auto-relación | Pre-evolución / evoluciones. Soporta ramificadas (ej. Eevee tiene 3 `evolvesTo`) |

### `Type` (17 filas) + `PokemonType` (join)

Catálogo de tipos (`fire`, `water`, ...). `PokemonType` es muchos-a-muchos con
`slot` (1 o 2, para mantener el orden tipo primario/secundario).

### `Ability` (114 filas) + `PokemonAbility` (join)

Catálogo de habilidades. `PokemonAbility` es muchos-a-muchos con `slot` (orden)
e `isHidden` (habilidad oculta sí/no).

Ver el detalle ejecutable en [`prisma/schema.prisma`](./prisma/schema.prisma).

### Qué NO está cargado hoy (fuera de alcance deliberado)

El seed (`prisma/seed.ts`) solo pide a PokeAPI los campos de la lista de arriba.
Lo siguiente **existe en PokeAPI pero no se descarga ni se guarda**:

| Dato | Por qué no está | Esfuerzo para agregarlo |
|---|---|---|
| Movimientos (moves) | Fuera del alcance original ("pokedex" básica) | Medio: nuevo modelo `Move` + `PokemonMove`, nuevo fetch a `pokemon.moves` en el seed |
| Condición de evolución (nivel, piedra, felicidad, etc.) | Hoy solo guardamos *qué* evoluciona de *qué*, no *cómo* | Medio: requiere parsear `evolution-chain` completo (hoy solo usamos `species.evolves_from_species`, más simple) |
| Nombres/flavorText en otros idiomas (es, ja, ...) | Solo se persiste inglés | Bajo: `species.names` / `flavor_text_entries` ya traen todos los idiomas, solo falta guardar más de un `language.name` |
| Formas regionales/alternas (Alola, Galar, Hisui, Paldea) | No son gen I, fuera de alcance a propósito | Alto: cambia el modelo (un "pokemon" dejaría de ser 1:1 con el id de pokedex) |
| Debilidades/resistencias por tipo | Se puede derivar en el cliente cruzando tipos contra una tabla de efectividad fija (no cambia, no necesita backend) | N/A — recomendado calcularlo en el frontend |
| Cries (sonido) | No pedido | Bajo: un campo más de URL, igual que los sprites |
| Pokémon #152 en adelante (gen II+) | Alcance explícito es la primera generación completa (151) | Alto: habría que revisar name collisions, nuevas evoluciones cross-gen, etc. |

Si se decide sumar alguno de estos, el patrón a seguir es siempre el mismo:
1. Agregar el/los campos o modelos en `prisma/schema.prisma`.
2. Migración: `npx prisma migrate dev --name <nombre>`.
3. Extender `src/lib/pokeapi.ts` (schema zod + fetch) para traer el dato nuevo de PokeAPI.
4. Extender `prisma/seed.ts` para guardarlo.
5. Extender `src/lib/mappers.ts` y `src/schemas/pokemon.ts` para exponerlo en la API.
6. Correr `npm run db:seed` de nuevo (es idempotente, borra y recarga todo).

## 3. Contrato de la API

Ver Swagger en `/docs` (o `/docs/json` para el spec OpenAPI crudo) corriendo el
servidor — es la fuente de verdad, se genera desde los JSON Schemas de
`src/schemas/pokemon.ts` y las rutas. Resumen en [`README.md`](./README.md#endpoints-principales)
y ejemplos de consumo en [`GUIA_ESTUDIANTES.md`](./GUIA_ESTUDIANTES.md).

## 4. El seed y por qué es así

`prisma/seed.ts`:
1. Pide a PokeAPI `pokemon/{id}` y `pokemon-species/{id}` para id 1..151, en
   lotes de 10 concurrentes (`mapInBatches`, en `src/lib/pokeapi.ts`).
2. Borra todas las tablas relacionadas con pokemon/tipos/habilidades.
3. Crea `Type` y `Ability` (catálogos) primero.
4. Inserta los 151 `Pokemon` **en orden ascendente de id**: esto es necesario
   para que `evolvesFromId` siempre apunte a un registro que ya existe (en gen I
   las pre-evoluciones siempre tienen id menor).

Es **idempotente**: se puede correr las veces que haga falta, siempre deja la
base en el mismo estado final. Por eso se corre como parte del *build* en
producción (ver `render.yaml`) en vez de una sola vez a mano.

## 5. Decisiones técnicas relevantes

- **Prisma 7 + driver adapter**: desde Prisma 7, `datasource.url` ya no va en
  `schema.prisma`; vive en `prisma.config.ts` y el `PrismaClient` necesita un
  adapter explícito (`@prisma/adapter-better-sqlite3`). Ver `src/lib/prisma.ts`.
  `prisma.config.ts` usa `process.env.DATABASE_URL ?? "file:./prisma/dev.db"`
  (no el helper estricto `env()`) para que `prisma generate` no falle en una
  instalación limpia sin la variable todavía definida (nos pasó en el primer
  deploy a Render).
- **SQLite en vez de Postgres**: el dataset es de solo lectura y fijo (151
  filas), no hay necesidad de un servidor de BD aparte. Si en algún momento se
  agregan escrituras de usuarios (favoritos, cuentas, etc.), ahí sí conviene
  migrar a Postgres.
- **CORS abierto (`*`)**: a propósito, porque múltiples estudiantes consumen la
  misma API desde distintos orígenes (localhost, sus propios dominios de PWA).
- **Deploy "horneado"**: el seed corre en el build de Render, no en cada
  arranque, para que el cold-start del free tier no dependa de que PokeAPI
  esté disponible en ese momento.

## 6. Cómo correr y desplegar

Ver [`README.md`](./README.md) para setup local, scripts npm y la sección de
deploy a Render.
