import { prisma } from "../src/lib/prisma.js";
import {
  fetchPokemon,
  fetchSpecies,
  mapInBatches,
  mapStats,
  pickEnglishFlavorText,
  pickEnglishGenus,
  type PokeApiPokemon,
  type PokeApiSpecies,
} from "../src/lib/pokeapi.js";

const POKEMON_COUNT = 150;
const BATCH_SIZE = 10;

interface RawRecord {
  pokemon: PokeApiPokemon;
  species: PokeApiSpecies;
}

async function main() {
  console.log(`Descargando datos de ${POKEMON_COUNT} pokemon desde PokeAPI...`);

  const ids = Array.from({ length: POKEMON_COUNT }, (_, i) => i + 1);
  const records: RawRecord[] = await mapInBatches(ids, BATCH_SIZE, async (id) => {
    const [pokemon, species] = await Promise.all([fetchPokemon(id), fetchSpecies(id)]);
    process.stdout.write(`  #${id} ${pokemon.name}\n`);
    return { pokemon, species };
  });

  console.log("Descarga completa. Limpiando base de datos...");
  await prisma.$transaction([
    prisma.pokemonAbility.deleteMany(),
    prisma.pokemonType.deleteMany(),
    prisma.pokemon.deleteMany(),
    prisma.ability.deleteMany(),
    prisma.type.deleteMany(),
  ]);

  const typeNames = new Set<string>();
  const abilityNames = new Set<string>();
  for (const { pokemon } of records) {
    pokemon.types.forEach((t) => typeNames.add(t.type.name));
    pokemon.abilities.forEach((a) => abilityNames.add(a.ability.name));
  }

  console.log(`Creando ${typeNames.size} tipos y ${abilityNames.size} habilidades...`);
  await prisma.type.createMany({ data: [...typeNames].map((name) => ({ name })) });
  await prisma.ability.createMany({ data: [...abilityNames].map((name) => ({ name })) });

  const types = await prisma.type.findMany();
  const abilities = await prisma.ability.findMany();
  const typeIdByName = new Map(types.map((t) => [t.name, t.id]));
  const abilityIdByName = new Map(abilities.map((a) => [a.name, a.id]));

  const nameToId = new Map(records.map((r) => [r.pokemon.name, r.pokemon.id]));

  console.log("Insertando pokemon (en orden ascendente, para resolver evoluciones)...");
  records.sort((a, b) => a.pokemon.id - b.pokemon.id);

  for (const { pokemon, species } of records) {
    const stats = mapStats(pokemon.stats);
    const evolvesFromName = species.evolves_from_species?.name ?? null;
    const evolvesFromId = evolvesFromName ? nameToId.get(evolvesFromName) ?? null : null;

    await prisma.pokemon.create({
      data: {
        id: pokemon.id,
        name: pokemon.name,
        genus: pickEnglishGenus(species),
        flavorText: pickEnglishFlavorText(species),
        height: pokemon.height,
        weight: pokemon.weight,
        baseExperience: pokemon.base_experience,
        captureRate: species.capture_rate,
        evolvesFromId,
        ...stats,
        spriteFront: pokemon.sprites.front_default,
        spriteBack: pokemon.sprites.back_default,
        spriteFrontShiny: pokemon.sprites.front_shiny,
        artworkOfficial: pokemon.sprites.other?.["official-artwork"]?.front_default ?? null,
        types: {
          create: pokemon.types.map((t) => ({
            slot: t.slot,
            type: { connect: { id: typeIdByName.get(t.type.name)! } },
          })),
        },
        abilities: {
          create: pokemon.abilities.map((a) => ({
            slot: a.slot,
            isHidden: a.is_hidden,
            ability: { connect: { id: abilityIdByName.get(a.ability.name)! } },
          })),
        },
      },
    });
  }

  console.log(`Seed completo: ${records.length} pokemon insertados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
