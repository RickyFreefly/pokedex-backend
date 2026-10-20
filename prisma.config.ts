import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Fallback explicito (no el helper `env()`, que revienta `prisma generate`
    // en una instalacion limpia sin DATABASE_URL todavia definida, ej. CI/Render).
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
