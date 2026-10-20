export const typeRef = {
  type: "string",
  description: "Nombre del tipo, ej. 'fire', 'water'",
};

export const pokemonSummarySchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    genus: { type: ["string", "null"] },
    types: { type: "array", items: typeRef },
    sprite: { type: ["string", "null"] },
    artwork: { type: ["string", "null"] },
  },
} as const;

export const pokemonListResponseSchema = {
  type: "object",
  properties: {
    data: { type: "array", items: pokemonSummarySchema },
    meta: {
      type: "object",
      properties: {
        total: { type: "integer" },
        limit: { type: "integer" },
        offset: { type: "integer" },
      },
    },
  },
} as const;

export const pokemonDetailSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    genus: { type: ["string", "null"] },
    flavorText: { type: ["string", "null"] },
    height: { type: "integer", description: "Altura en decimetros" },
    weight: { type: "integer", description: "Peso en hectogramos" },
    baseExperience: { type: ["integer", "null"] },
    captureRate: { type: ["integer", "null"] },
    types: { type: "array", items: typeRef },
    abilities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          isHidden: { type: "boolean" },
        },
      },
    },
    stats: {
      type: "object",
      properties: {
        hp: { type: "integer" },
        attack: { type: "integer" },
        defense: { type: "integer" },
        specialAttack: { type: "integer" },
        specialDefense: { type: "integer" },
        speed: { type: "integer" },
      },
    },
    sprites: {
      type: "object",
      properties: {
        front: { type: ["string", "null"] },
        back: { type: ["string", "null"] },
        frontShiny: { type: ["string", "null"] },
        artworkOfficial: { type: ["string", "null"] },
      },
    },
    evolvesFrom: {
      type: ["object", "null"],
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
      },
    },
    evolvesTo: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
        },
      },
    },
  },
} as const;

export const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    message: { type: "string" },
  },
} as const;
