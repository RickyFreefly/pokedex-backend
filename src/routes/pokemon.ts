import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { toDetail, toSummary } from "../lib/mappers.js";
import {
  errorResponseSchema,
  pokemonDetailSchema,
  pokemonListResponseSchema,
} from "../schemas/pokemon.js";

const pokemonInclude = {
  types: { include: { type: true } },
  abilities: { include: { ability: true } },
} as const;

export async function pokemonRoutes(app: FastifyInstance) {
  app.get(
    "/api/pokemon",
    {
      schema: {
        description: "Lista paginada de los 151 pokemon de la gen I, con filtros opcionales.",
        tags: ["pokemon"],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "integer", minimum: 0, default: 0 },
            search: { type: "string" },
            type: { type: "string" },
          },
        },
        response: { 200: pokemonListResponseSchema },
      },
    },
    async (request) => {
      const { limit = 20, offset = 0, search, type } = request.query as {
        limit?: number;
        offset?: number;
        search?: string;
        type?: string;
      };

      const where = {
        AND: [
          search
            ? { name: { contains: search.toLowerCase() } }
            : {},
          type
            ? { types: { some: { type: { name: type.toLowerCase() } } } }
            : {},
        ],
      };

      const [total, pokemons] = await Promise.all([
        prisma.pokemon.count({ where }),
        prisma.pokemon.findMany({
          where,
          include: pokemonInclude,
          orderBy: { id: "asc" },
          take: limit,
          skip: offset,
        }),
      ]);

      return {
        data: pokemons.map(toSummary),
        meta: { total, limit, offset },
      };
    },
  );

  app.get(
    "/api/pokemon/:idOrName",
    {
      schema: {
        description: "Detalle de un pokemon por id numerico o por nombre.",
        tags: ["pokemon"],
        params: {
          type: "object",
          properties: { idOrName: { type: "string" } },
          required: ["idOrName"],
        },
        response: { 200: pokemonDetailSchema, 404: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const { idOrName } = request.params as { idOrName: string };
      const asId = Number(idOrName);
      const where = Number.isInteger(asId) ? { id: asId } : { name: idOrName.toLowerCase() };

      const pokemon = await prisma.pokemon.findUnique({
        where,
        include: { ...pokemonInclude, evolvesFrom: true, evolvesTo: true },
      });

      if (!pokemon) {
        return reply.status(404).send({
          error: "not_found",
          message: `No se encontro un pokemon con id/nombre '${idOrName}'`,
        });
      }

      return toDetail(pokemon);
    },
  );
}
