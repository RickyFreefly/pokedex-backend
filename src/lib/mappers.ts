import type { Ability, Pokemon, PokemonAbility, PokemonType, Type } from "@prisma/client";

type PokemonWithRelations = Pokemon & {
  types: (PokemonType & { type: Type })[];
  abilities: (PokemonAbility & { ability: Ability })[];
  evolvesFrom?: Pokemon | null;
  evolvesTo?: Pokemon[];
};

export function toSummary(pokemon: PokemonWithRelations) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    genus: pokemon.genus,
    types: pokemon.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    sprite: pokemon.spriteFront,
    artwork: pokemon.artworkOfficial,
  };
}

export function toDetail(pokemon: PokemonWithRelations) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    genus: pokemon.genus,
    flavorText: pokemon.flavorText,
    height: pokemon.height,
    weight: pokemon.weight,
    baseExperience: pokemon.baseExperience,
    captureRate: pokemon.captureRate,
    types: pokemon.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    abilities: pokemon.abilities
      .sort((a, b) => a.slot - b.slot)
      .map((a) => ({ name: a.ability.name, isHidden: a.isHidden })),
    stats: {
      hp: pokemon.hp,
      attack: pokemon.attack,
      defense: pokemon.defense,
      specialAttack: pokemon.specialAttack,
      specialDefense: pokemon.specialDefense,
      speed: pokemon.speed,
    },
    sprites: {
      front: pokemon.spriteFront,
      back: pokemon.spriteBack,
      frontShiny: pokemon.spriteFrontShiny,
      artworkOfficial: pokemon.artworkOfficial,
    },
    evolvesFrom: pokemon.evolvesFrom
      ? { id: pokemon.evolvesFrom.id, name: pokemon.evolvesFrom.name }
      : null,
    evolvesTo: (pokemon.evolvesTo ?? []).map((p) => ({ id: p.id, name: p.name })),
  };
}
