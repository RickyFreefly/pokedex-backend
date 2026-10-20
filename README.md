# Pokedex Backend (Gen I)

API REST con los 151 Pokemon de la primera generacion, pensada como backend para una PWA tipo "Pokedex".

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
npm run db:seed             # descarga los 151 pokemon desde PokeAPI (~1-2 min)
npm run dev                 # levanta el servidor en modo watch
```

Servidor por defecto en `http://localhost:3000`.
Documentacion interactiva (Swagger UI) en `http://localhost:3000/docs`.

> ¿Eres estudiante y vas a **consumir** esta API para construir tu propia PWA?
> Lee [`GUIA_ESTUDIANTES.md`](./GUIA_ESTUDIANTES.md) en vez de esta sección — ahí
> están la URL pública, ejemplos de uso y el contrato de cada endpoint.
>
> ¿Vas a **mantener o extender** el backend? Lee
> [`MANUAL_DESARROLLO.md`](./MANUAL_DESARROLLO.md) — ahí está la arquitectura,
> el modelo de datos completo (qué trae y qué podría cargarse) y las decisiones
> técnicas detrás de cada cosa.

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

## Despliegue público (Render)

Este repo es el backend de un ejercicio de curso: se publica una sola vez y cada
estudiante construye su propia PWA consumiéndolo. El dataset es fijo (151 pokemon,
sin escrituras en producción), así que el seed se "hornea" en el build en vez de
correr en cada arranque — así el servicio despierta rápido tras dormirse por
inactividad (free tier) sin depender de que PokeAPI esté disponible en ese momento.

1. Entra a [render.com](https://render.com) → **New +** → **Blueprint**.
2. Conecta tu cuenta de GitHub y selecciona el repo `pokedex-backend`.
3. Render detecta `render.yaml` automáticamente (build command, start command,
   healthcheck en `/health`, variables de entorno). Click **Apply**.
4. El primer build tarda ~1-2 min extra porque corre `npm run db:seed` (descarga
   los 151 pokemon desde PokeAPI). Deploys siguientes son iguales: si cambias
   código, el seed se vuelve a correr automáticamente en cada build.
5. Comparte con los estudiantes la URL pública que te da Render, por ejemplo
   `https://pokedex-backend-xxxx.onrender.com`, y su Swagger en
   `https://pokedex-backend-xxxx.onrender.com/docs`.

> El free tier de Render duerme el servicio tras ~15 min sin tráfico; la primera
> request después de dormir tarda ~30-50s en responder (cold start), las
> siguientes son rápidas. Avísalo a los estudiantes para que no piensen que la
> API está caída.

`CORS_ORIGIN=*` queda abierto a propósito: cada estudiante consumirá la API desde
un origen distinto (localhost en dev, su propio dominio de PWA en producción).

## Modelo de datos

- `Pokemon`: datos base, stats (hp/attack/defense/specialAttack/specialDefense/speed), sprites, genero (genus), texto de pokedex, y referencia a su pre-evolucion (`evolvesFromId`, auto-relacion).
- `Type` / `PokemonType`: catalogo de tipos y relacion muchos-a-muchos con pokemon.
- `Ability` / `PokemonAbility`: catalogo de habilidades (incluye si es habilidad oculta).

Ver `prisma/schema.prisma` para el detalle completo.

## Notas de arquitectura

- CORS abierto por defecto (`CORS_ORIGIN=*`), pensado para ser consumido desde un dominio/PWA distinto. Restringir en produccion vía `.env`.
- El seed es idempotente: borra y vuelve a crear todos los registros relacionados con pokemon, tipos y habilidades en cada corrida.
- Prisma 7 requiere un driver adapter explicito (ya configurado con `better-sqlite3`); ver `prisma.config.ts` y `src/lib/prisma.ts`.
