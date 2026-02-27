/**
 * Push all Pokemon from data/pokemon.json to a Coveo Push source
 *
 * Usage: npx tsx scripts/push-to-coveo.ts
 *
 * Requires these env vars (from .env.local):
 *   COVEO_ORG_ID, COVEO_API_KEY, COVEO_SOURCE_ID
 */

import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ORG_ID = process.env.COVEO_ORG_ID!;
const API_KEY = process.env.COVEO_API_KEY!;
const SOURCE_ID = process.env.COVEO_SOURCE_ID!;

if (!ORG_ID || !API_KEY || !SOURCE_ID) {
  console.error("missing COVEO_ORG_ID, COVEO_API_KEY, or COVEO_SOURCE_ID in .env.local");
  process.exit(1);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface Pokemon {
  name: string;
  number: string;
  types: string[];
  generation: string;
  species: string;
  description: string;
  stats: Record<string, number>;
  abilities: string[];
  height: string;
  weight: string;
  imageUrl: string;
  url: string;
  evolutionChain?: { name: string; condition: string }[];
  typeDefenses?: Record<string, number>;
  eggGroups?: string[];
  growthRate?: string;
  catchRate?: number;
  baseFriendship?: number;
  baseExperience?: number;
  evYield?: string;
  genderRatio?: { male: number; female: number };
}

function buildRichBody(p: Pokemon): string {
  const lines: string[] = [];

  lines.push(`${p.name} is a ${p.species} (${p.types.join("/")}-type) from ${p.generation}.`);
  if (p.description) lines.push(p.description);
  lines.push(`It is ${p.height} tall and weighs ${p.weight}.`);

  if (p.abilities?.length) {
    lines.push(`Abilities: ${p.abilities.join(", ")}.`);
  }

  if (p.stats && Object.keys(p.stats).length) {
    const total = Object.values(p.stats).reduce((a, b) => a + b, 0);
    const statStr = Object.entries(p.stats).map(([k, v]) => `${k} ${v}`).join(", ");
    lines.push(`Base stats (total ${total}): ${statStr}.`);
  }

  if (p.evolutionChain?.length) {
    const chain = p.evolutionChain.map((e) => e.condition ? `${e.name} ${e.condition}` : e.name).join(" → ");
    lines.push(`Evolution chain: ${chain}.`);
  }

  if (p.typeDefenses && Object.keys(p.typeDefenses).length) {
    const weak = Object.entries(p.typeDefenses).filter(([, v]) => v > 1).map(([k, v]) => `${k} (×${v})`);
    const resist = Object.entries(p.typeDefenses).filter(([, v]) => v > 0 && v < 1).map(([k, v]) => `${k} (×${v})`);
    const immune = Object.entries(p.typeDefenses).filter(([, v]) => v === 0).map(([k]) => k);
    if (weak.length) lines.push(`Weak to: ${weak.join(", ")}.`);
    if (resist.length) lines.push(`Resists: ${resist.join(", ")}.`);
    if (immune.length) lines.push(`Immune to: ${immune.join(", ")}.`);
  }

  if (p.eggGroups?.length) lines.push(`Egg groups: ${p.eggGroups.join(", ")}.`);
  if (p.growthRate) lines.push(`Growth rate: ${p.growthRate}.`);
  if (p.catchRate) lines.push(`Catch rate: ${p.catchRate}.`);
  if (p.baseExperience) lines.push(`Base experience: ${p.baseExperience}.`);
  if (p.evYield) lines.push(`EV yield: ${p.evYield}.`);

  return lines.join(" ");
}

async function pushDocument(pokemon: Pokemon) {
  const documentId = pokemon.url;
  const url = `https://api.cloud.coveo.com/push/v1/organizations/${ORG_ID}/sources/${SOURCE_ID}/documents?documentId=${encodeURIComponent(documentId)}`;

  const body = {
    title: pokemon.name,
    clickableUri: pokemon.url,
    data: buildRichBody(pokemon),
    fileExtension: ".html",
    permissions: [{ allowAnonymous: true }],
    pokemonimage: pokemon.imageUrl,
    pokemonnumber: parseInt(pokemon.number, 10) || 0,
    pokemontype: pokemon.types,
    pokemonspecies: pokemon.species,
    pokemongeneration: pokemon.generation,
    pokemonabilities: pokemon.abilities,
    pokemonstats: JSON.stringify(pokemon.stats),
    pokemonheight: pokemon.height,
    pokemonweight: pokemon.weight,
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`push failed for ${pokemon.name}: ${err}`);
  }
}

async function main() {
  const raw = fs.readFileSync("data/pokemon.json", "utf-8");
  const pokemons: Pokemon[] = JSON.parse(raw);

  console.log(`pushing ${pokemons.length} pokemon to Coveo...\n`);

  let ok = 0;
  let errors = 0;

  for (let i = 0; i < pokemons.length; i++) {
    const p = pokemons[i];
    try {
      await pushDocument(p);
      ok++;
      if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${pokemons.length} pushed`);
    } catch (err) {
      console.error(`  error: ${err}`);
      errors++;
    }

    // small delay to stay within rate limits
    await sleep(100);
  }

  console.log(`\ndone! ${ok} pushed, ${errors} errors`);
}

main();
