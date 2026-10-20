import { buildApp } from "./app.js";
import { env } from "./lib/env.js";

async function main() {
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: env.HOST });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
