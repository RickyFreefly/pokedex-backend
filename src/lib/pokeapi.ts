import { z } from "zod";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";

const pokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  base_experience: z.number().nullable(),
  sprites: z.object({
    front_default: z.string().nullable(),
    back_default: z.string().nullable(),
    front_shiny: z.string().nullable(),
    other: z
      .object({
        "official-artwork": z.object({ front_default: z.string().nullable() }).optional(),
      })
      .optional(),
  }),
  stats: z.array(
    z.object({
      base_stat: z.number(),
      stat: z.object({ name: z.string() }),
    }),
  ),
  types: z.array(
    z.object({
      slot: z.number(),
      type: z.object({ name: z.string() }),
    }),
  ),
  abilities: z.array(
    z.object({
      slot: z.number(),
      is_hidden: z.boolean(),
      ability: z.object({ name: z.string() }),
    }),
  ),
});

const speciesSchema = z.object({
  capture_rate: z.number().nullable(),
  genera: z.array(z.object({ genus: z.string(), language: z.object({ name: z.string() }) })),
  flavor_text_entries: z.array(
    z.object({
      flavor_text: z.string(),
      language: z.object({ name: z.string() }),
    }),
  ),
  evolves_from_species: z.object({ name: z.string() }).nullable(),
});

export type PokeApiPokemon = z.infer<typeof pokemonSchema>;
export type PokeApiSpecies = z.infer<typeof speciesSchema>;

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PokeAPI respondio ${response.status} para ${url}`);
  }
  return response.json();
}

export async function fetchPokemon(id: number): Promise<PokeApiPokemon> {
  const json = await fetchJson(`${POKEAPI_BASE}/pokemon/${id}`);
  return pokemonSchema.parse(json);
}

export async function fetchSpecies(id: number): Promise<PokeApiSpecies> {
  const json = await fetchJson(`${POKEAPI_BASE}/pokemon-species/${id}`);
  return speciesSchema.parse(json);
}

const STAT_NAME_MAP: Record<string, keyof StatBlock> = {
  hp: "hp",
  attack: "attack",
  defense: "defense",
  "special-attack": "specialAttack",
  "special-defense": "specialDefense",
  speed: "speed",
};

export interface StatBlock {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export function mapStats(stats: PokeApiPokemon["stats"]): StatBlock {
  const block: StatBlock = {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  };
  for (const entry of stats) {
    const key = STAT_NAME_MAP[entry.stat.name];
    if (key) block[key] = entry.base_stat;
  }
  return block;
}

export function pickEnglishGenus(species: PokeApiSpecies): string | null {
  return species.genera.find((g) => g.language.name === "en")?.genus ?? null;
}

export function pickEnglishFlavorText(species: PokeApiSpecies): string | null {
  const entry = species.flavor_text_entries.find((f) => f.language.name === "en");
  if (!entry) return null;
  return entry.flavor_text.replace(/[\n\f\r]+/g, " ").trim();
}

/** Procesa un arreglo de forma concurrente, en lotes de `batchSize`. */
export async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}
