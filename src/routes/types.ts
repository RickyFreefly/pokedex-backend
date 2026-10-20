import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { toSummary } from "../lib/mappers.js";
import { errorResponseSchema, pokemonListResponseSchema } from "../schemas/pokemon.js";

export async function typeRoutes(app: FastifyInstance) {
  app.get(
    "/api/types",
    {
      schema: {
        description: "Lista de tipos de Pokemon disponibles en la generacion I, con su conteo.",
        tags: ["types"],
        response: {
          200: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    pokemonCount: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      const types = await prisma.type.findMany({
        include: { _count: { select: { pokemons: true } } },
        orderBy: { name: "asc" },
      });

      return {
        data: types.map((t) => ({ name: t.name, pokemonCount: t._count.pokemons })),
      };
    },
  );

  app.get(
    "/api/types/:name/pokemon",
    {
      schema: {
        description: "Pokemon (gen I) que pertenecen a un tipo dado.",
        tags: ["types"],
        params: {
          type: "object",
          properties: { name: { type: "string" } },
          required: ["name"],
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "integer", minimum: 0, default: 0 },
          },
        },
        response: { 200: pokemonListResponseSchema, 404: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const { name } = request.params as { name: string };
      const { limit = 20, offset = 0 } = request.query as { limit?: number; offset?: number };

      const type = await prisma.type.findUnique({ where: { name: name.toLowerCase() } });
      if (!type) {
        return reply.status(404).send({
          error: "not_found",
          message: `No se encontro el tipo '${name}'`,
        });
      }

      const where = { types: { some: { typeId: type.id } } };
      const [total, pokemons] = await Promise.all([
        prisma.pokemon.count({ where }),
        prisma.pokemon.findMany({
          where,
          include: { types: { include: { type: true } }, abilities: { include: { ability: true } } },
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
}
