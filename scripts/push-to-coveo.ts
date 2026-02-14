import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

interface PokemonData {
  name: string;
  number: string;
  types: string[];
  generation: string;
  imageUrl: string;
  species: string;
  abilities: string[];
  stats: Record<string, number>;
  description: string;
  height: string;
  weight: string;
  url: string;
}

const ORG_ID = process.env.COVEO_ORG_ID!;
const API_KEY = process.env.COVEO_API_KEY!;
const SOURCE_ID = process.env.COVEO_SOURCE_ID!;

const PUSH_BASE = `https://api.cloud.coveo.com/push/v1/organizations/${ORG_ID}/sources/${SOURCE_ID}`;

if (!ORG_ID || !API_KEY || !SOURCE_ID) {
  console.error("Missing env vars. Set COVEO_ORG_ID, COVEO_API_KEY, COVEO_SOURCE_ID in .env.local");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

async function setStatus(status: "REBUILD" | "IDLE") {
  const res = await fetch(`${PUSH_BASE}/status?statusType=${status}`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(`Status ${status} failed: ${res.status} ${await res.text()}`);
  console.log(`Source status -> ${status}`);
}

async function pushDoc(pokemon: PokemonData) {
  const body = {
    title: pokemon.name,
    data: [
      `${pokemon.name} is a ${pokemon.types.join("/")} type Pokemon.`,
      `Pokedex number: ${pokemon.number}. Generation: ${pokemon.generation}.`,
      `Species: ${pokemon.species}.`,
      pokemon.abilities.length ? `Abilities: ${pokemon.abilities.join(", ")}.` : "",
      pokemon.description,
    ].filter(Boolean).join(" "),
    fileExtension: ".html",
    clickableUri: pokemon.url,
    permanentId: `pokemon-${pokemon.number}`,
    pokemontype: pokemon.types,
    pokemongeneration: pokemon.generation,
    pokemonimage: pokemon.imageUrl,
    pokemonnumber: parseInt(pokemon.number) || 0,
    pokemonstats: JSON.stringify(pokemon.stats),
    pokemonspecies: pokemon.species,
    pokemonabilities: pokemon.abilities,
    pokemonheight: pokemon.height,
    pokemonweight: pokemon.weight,
  };

  const uri = encodeURIComponent(pokemon.url);
  const res = await fetch(`${PUSH_BASE}/documents?documentId=${uri}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Push ${pokemon.name} failed: ${res.status} ${await res.text()}`);
}

async function main() {
  const dataPath = path.join(__dirname, "..", "data", "pokemon.json");
  if (!fs.existsSync(dataPath)) {
    console.error("No data file found. Run 'npm run scrape' first.");
    process.exit(1);
  }

  const pokemon: PokemonData[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`Pushing ${pokemon.length} Pokemon to Coveo...\n`);

  await setStatus("REBUILD");

  let ok = 0, fail = 0;

  for (let i = 0; i < pokemon.length; i++) {
    const p = pokemon[i];
    process.stdout.write(`  [${i + 1}/${pokemon.length}] ${p.name}...`);
    try {
      await pushDoc(p);
      console.log(" OK");
      ok++;
    } catch (err) {
      console.log(` FAIL: ${err}`);
      fail++;
    }

    // Small delay every 10 docs to avoid rate limits
    if (i % 10 === 9) await new Promise((r) => setTimeout(r, 300));
  }

  await setStatus("IDLE");
  console.log(`\nDone: ${ok} pushed, ${fail} failed.`);
}

main().catch(console.error);
