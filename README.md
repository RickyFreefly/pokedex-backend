# Pokedex Backend (Gen I)

API REST con los primeros 150 Pokemon, pensada como backend para una PWA tipo "Pokedex".

## Stack

- **Node.js 24** + **TypeScript**
- **Fastify 5** (servidor HTTP + validacion de esquemas + Swagger/OpenAPI)
- **Prisma 7** + **SQLite** (via `@prisma/adapter-better-sqlite3`)
- **Zod** para validar variables de entorno y respuestas de PokeAPI durante el seed
- Datos poblados una sola vez desde [PokeAPI](https://pokeapi.co) mediante un script de seed. En runtime el backend **no depende de PokeAPI**, todo vive en la base de datos local.

## Requisitos

- Node.js >= 20
- npm

## Puesta en marcha

```bash
npm install
cp .env.example .env        # ajusta PORT / CORS_ORIGIN si hace falta
npx prisma migrate dev --name init   # crea prisma/dev.db y aplica el esquema
npm run db:seed             # descarga los 150 pokemon desde PokeAPI (~1-2 min)
npm run dev                 # levanta el servidor en modo watch
```

Servidor por defecto en `http://localhost:3000`.
Documentacion interactiva (Swagger UI) en `http://localhost:3000/docs`.

## Scripts

| Script                  | Descripcion                                              |
|-------------------------|-----------------------------------------------------------|
| `npm run dev`            | Servidor en modo desarrollo con recarga automatica        |
| `npm run build`          | Compila TypeScript a `dist/`                              |
| `npm start`              | Corre el build compilado (`dist/server.js`)                |
| `npm run prisma:migrate` | Crea/aplica migraciones de Prisma                          |
| `npm run db:seed`        | Vuelve a poblar la base de datos desde PokeAPI (idempotente)|

## Endpoints principales

Todas las respuestas son JSON. Prefijo `/api`.

| Metodo | Ruta                          | Descripcion                                               |
|--------|-------------------------------|-------------------------------------------------------------|
| GET    | `/health`                     | Estado del servicio + conteo de pokemon en BD                |
| GET    | `/api/pokemon`                | Lista paginada. Query: `limit`, `offset`, `search`, `type`    |
| GET    | `/api/pokemon/:idOrName`      | Detalle completo (stats, tipos, habilidades, sprites, evoluciones) |
| GET    | `/api/types`                  | Lista de tipos de la gen I con conteo de pokemon              |
| GET    | `/api/types/:name/pokemon`    | Pokemon de un tipo dado (paginado)                            |
| GET    | `/docs`                       | Swagger UI                                                    |

### Ejemplos

```bash
curl "http://localhost:3000/api/pokemon?limit=10&search=char"
curl "http://localhost:3000/api/pokemon/25"        # por id
curl "http://localhost:3000/api/pokemon/pikachu"   # por nombre
curl "http://localhost:3000/api/types/fire/pokemon"
```

## Modelo de datos

- `Pokemon`: datos base, stats (hp/attack/defense/specialAttack/specialDefense/speed), sprites, genero (genus), texto de pokedex, y referencia a su pre-evolucion (`evolvesFromId`, auto-relacion).
- `Type` / `PokemonType`: catalogo de tipos y relacion muchos-a-muchos con pokemon.
- `Ability` / `PokemonAbility`: catalogo de habilidades (incluye si es habilidad oculta).

Ver `prisma/schema.prisma` para el detalle completo.

## Notas de arquitectura

- CORS abierto por defecto (`CORS_ORIGIN=*`), pensado para ser consumido desde un dominio/PWA distinto. Restringir en produccion vía `.env`.
- El seed es idempotente: borra y vuelve a crear todos los registros relacionados con pokemon, tipos y habilidades en cada corrida.
- Prisma 7 requiere un driver adapter explicito (ya configurado con `better-sqlite3`); ver `prisma.config.ts` y `src/lib/prisma.ts`.
