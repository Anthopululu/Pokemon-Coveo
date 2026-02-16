/**
 * Scrape all Pokemon from pokemondb.net and save to data/pokemon.json
 *
 * Usage: npx tsx scripts/scrape-pokemon.ts
 *
 * How it works:
 * 1. Fetches the national pokedex page (list of all Pokemon)
 * 2. For each Pokemon, fetches its detail page
 * 3. Parses the HTML to extract name, types, stats, etc.
 * 4. Saves everything to data/pokemon.json
 */

import * as fs from "fs";
import * as cheerio from "cheerio";

const BASE_URL = "https://pokemondb.net";

// pause between requests so we don't hammer the server
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// fetch a page and return the HTML
async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

// get the list of all Pokemon URLs from the national dex page
async function getPokemonList(): Promise<{ name: string; url: string }[]> {
  const html = await fetchPage(`${BASE_URL}/pokedex/national`);
  const $ = cheerio.load(html);

  const list: { name: string; url: string }[] = [];

  $(".infocard .ent-name").each((_, el) => {
    const name = $(el).text().trim();
    const href = $(el).closest("a").attr("href");
    if (name && href) {
      list.push({ name, url: `${BASE_URL}${href}` });
    }
  });

  return list;
}

// scrape a single Pokemon detail page
async function scrapePokemon(url: string): Promise<Record<string, unknown> | null> {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const name = $("h1").first().text().trim();
  if (!name) return null;

  // vitals table (first one = main form)
  const vitals = $("table.vitals-table").first();
  const rows = vitals.find("tbody tr");

  let number = "";
  let types: string[] = [];
  let species = "";
  let height = "";
  let weight = "";
  let abilities: string[] = [];

  rows.each((_, row) => {
    const label = $(row).find("th").text().trim();
    const value = $(row).find("td");

    if (label === "National №") {
      number = value.text().trim();
    } else if (label === "Type") {
      types = value.find("a").map((_, a) => $(a).text().trim()).get();
    } else if (label === "Species") {
      species = value.text().trim();
    } else if (label === "Height") {
      height = value.text().trim();
    } else if (label === "Weight") {
      weight = value.text().trim();
    } else if (label === "Abilities") {
      abilities = value.find("a").map((_, a) => $(a).text().trim()).get();
    }
  });

  // stats
  const stats: Record<string, number> = {};
  $("table.vitals-table").each((_, table) => {
    const heading = $(table).prev("h2").text();
    if (!heading.includes("Base stats")) return;
    $(table).find("tbody tr").each((_, row) => {
      const statName = $(row).find("th").text().trim();
      const statVal = $(row).find("td.cell-num").first().text().trim();
      if (statName && statVal) stats[statName] = parseInt(statVal, 10);
    });
  });

  // generation (from the pokedex data section)
  let generation = "";
  $("h2").each((_, h2) => {
    const text = $(h2).text();
    if (text.includes("Pokédex entries")) {
      const firstVersion = $(h2).next("table").find("th").first().text().trim();
      // map game versions to generations
      const genMap: Record<string, string> = {
        Red: "Generation 1", Blue: "Generation 1", Yellow: "Generation 1",
        Gold: "Generation 2", Silver: "Generation 2", Crystal: "Generation 2",
        Ruby: "Generation 3", Sapphire: "Generation 3", Emerald: "Generation 3",
        FireRed: "Generation 3", LeafGreen: "Generation 3",
        Diamond: "Generation 4", Pearl: "Generation 4", Platinum: "Generation 4",
        HeartGold: "Generation 4", SoulSilver: "Generation 4",
        Black: "Generation 5", White: "Generation 5",
        "Black 2": "Generation 5", "White 2": "Generation 5",
        X: "Generation 6", Y: "Generation 6",
        "Omega Ruby": "Generation 6", "Alpha Sapphire": "Generation 6",
        Sun: "Generation 7", Moon: "Generation 7",
        "Ultra Sun": "Generation 7", "Ultra Moon": "Generation 7",
        Sword: "Generation 8", Shield: "Generation 8",
        "Legends: Arceus": "Generation 8",
        Scarlet: "Generation 9", Violet: "Generation 9",
      };
      for (const [game, gen] of Object.entries(genMap)) {
        if (firstVersion.includes(game)) { generation = gen; break; }
      }
    }
  });

  // fallback: guess generation from number
  if (!generation) {
    const n = parseInt(number, 10);
    if (n <= 151) generation = "Generation 1";
    else if (n <= 251) generation = "Generation 2";
    else if (n <= 386) generation = "Generation 3";
    else if (n <= 493) generation = "Generation 4";
    else if (n <= 649) generation = "Generation 5";
    else if (n <= 721) generation = "Generation 6";
    else if (n <= 809) generation = "Generation 7";
    else if (n <= 905) generation = "Generation 8";
    else generation = "Generation 9";
  }

  // description (first pokedex entry)
  let description = "";
  $("td.cell-pokemon-entry").each((_, td) => {
    if (!description) description = $(td).text().trim();
  });

  // image
  const imageUrl = $("picture source").first().attr("srcset")
    || $(".pokemon-artwork img, .pokemon-image img").first().attr("src")
    || `https://img.pokemondb.net/artwork/large/${name.toLowerCase()}.jpg`;

  return {
    name,
    number,
    types,
    generation,
    species,
    description,
    stats,
    abilities,
    height,
    weight,
    imageUrl,
    url,
  };
}

// main
async function main() {
  console.log("fetching pokemon list...");
  const list = await getPokemonList();
  console.log(`found ${list.length} pokemon\n`);

  const results: Record<string, unknown>[] = [];

  for (let i = 0; i < list.length; i++) {
    const { name, url } = list[i];
    console.log(`[${i + 1}/${list.length}] ${name}`);

    try {
      const data = await scrapePokemon(url);
      if (data) results.push(data);
    } catch (err) {
      console.error(`  error: ${err}`);
    }

    // 200ms between requests to be polite
    await sleep(200);
  }

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync("data/pokemon.json", JSON.stringify(results, null, 2));
  console.log(`\ndone! saved ${results.length} pokemon to data/pokemon.json`);
}

main();
