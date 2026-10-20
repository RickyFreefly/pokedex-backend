import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./lib/env.js";
import { healthRoutes } from "./routes/health.js";
import { pokemonRoutes } from "./routes/pokemon.js";
import { typeRoutes } from "./routes/types.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: env.CORS_ORIGIN });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Pokedex API (Gen I)",
        description: "API REST con los 151 Pokemon de la primera generacion, pensada para alimentar una PWA tipo Pokedex.",
        version: "1.0.0",
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  await app.register(healthRoutes);
  await app.register(pokemonRoutes);
  await app.register(typeRoutes);

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      error: statusCode === 500 ? "internal_error" : "bad_request",
      message: error.message,
    });
  });

  return app;
}
