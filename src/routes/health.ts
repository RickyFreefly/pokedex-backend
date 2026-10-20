import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get(
    "/health",
    {
      schema: {
        description: "Chequeo de salud del servicio y de la conexion a la base de datos.",
        tags: ["health"],
      },
    },
    async () => {
      const pokemonCount = await prisma.pokemon.count();
      return { status: "ok", pokemonCount };
    },
  );
}
