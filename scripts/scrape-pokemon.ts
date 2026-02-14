import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

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

const BASE_URL = "https://pokemondb.net";
const DELAY_MS = 400;

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PokemonCoveoChallenge/1.0; educational project)",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGeneration(num: number): string {
  if (num <= 151) return "Generation 1";
  if (num <= 251) return "Generation 2";
  if (num <= 386) return "Generation 3";
  if (num <= 493) return "Generation 4";
  if (num <= 649) return "Generation 5";
  if (num <= 721) return "Generation 6";
  if (num <= 809) return "Generation 7";
  if (num <= 905) return "Generation 8";
  return "Generation 9";
}

async function getPokemonList(): Promise<string[]> {
  console.log("Fetching national Pokedex...");
  const html = await fetchPage(`${BASE_URL}/pokedex/national`);
  const $ = cheerio.load(html);

  const urls: string[] = [];
  $('a[href^="/pokedex/"]').each((_, el) => {
    const href = $(el).attr("href")!;
    const parts = href.split("/").filter(Boolean);
    if (
      parts.length === 2 &&
      parts[0] === "pokedex" &&
      !parts[1].includes("?") &&
      parts[1] !== "national" &&
      !urls.includes(href)
    ) {
      urls.push(href);
    }
  });

  console.log(`Found ${urls.length} Pokemon URLs`);
  return urls;
}

async function scrapePokemon(relativeUrl: string): Promise<PokemonData | null> {
  try {
    const html = await fetchPage(`${BASE_URL}${relativeUrl}`);
    const $ = cheerio.load(html);

    const name = $("h1").first().text().trim();

    // Number
    let number = "";
    $(".vitals-table").first().find("tr").each((_, row) => {
      if ($(row).find("th").text().includes("National")) {
        number = $(row).find("td strong").text().trim();
      }
    });

    // Types
    const types: string[] = [];
    $(".vitals-table").first().find("tr").each((_, row) => {
      if ($(row).find("th").text().trim() === "Type") {
        $(row).find("td a.type-icon").each((_, a) => types.push($(a).text().trim()));
      }
    });

    // Generation - try intro paragraph first, fallback to number-based lookup
    let generation = "";
    const introText = $("main p").first().text();
    const genMatch = introText.match(/Generation (\d+)/);
    if (genMatch) {
      generation = `Generation ${genMatch[1]}`;
    } else if (number) {
      generation = getGeneration(parseInt(number));
    }

    const imageUrl = $('meta[property="og:image"]').attr("content") || "";

    // Species, Height, Weight, Abilities - all from the first vitals table
    let species = "", height = "", weight = "";
    const abilities: string[] = [];

    $(".vitals-table").first().find("tr").each((_, row) => {
      const th = $(row).find("th").text().trim();
      const td = $(row).find("td");
      if (th === "Species") species = td.text().trim();
      if (th === "Height") height = td.text().trim();
      if (th === "Weight") weight = td.text().trim();
      if (th === "Abilities") {
        td.find("a").each((_, a) => {
          const ability = $(a).text().trim();
          if (ability && ability !== "\u2014") abilities.push(ability);
        });
      }
    });

    // Base stats: find the table with HP rows
    const stats: Record<string, number> = {};
    let foundStats = false;
    $("table.vitals-table").each((_, table) => {
      if (foundStats) return;
      const rows = $(table).find("tr");
      const hasHP = rows.toArray().some((r) => $(r).find("th").text().trim() === "HP");
      if (hasHP) {
        foundStats = true;
        rows.each((_, row) => {
          const th = $(row).find("th").text().trim();
          if (["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"].includes(th)) {
            const val = parseInt($(row).find("td").first().text().trim());
            if (!isNaN(val)) stats[th] = val;
          }
        });
      }
    });

    // Description from flavor text section
    let description = "";
    const flavorSection = $("#dex-flavor");
    if (flavorSection.length) {
      flavorSection.nextAll("table.vitals-table, div").each((_, el) => {
        if (description) return;
        $(el).find("td.cell-med-text").each((_, td) => {
          if (!description) description = $(td).text().trim();
        });
      });
    }
    if (!description) {
      $("td.cell-med-text").each((_, td) => {
        if (!description) description = $(td).text().trim();
      });
    }

    if (!name || !number) return null;

    return {
      name, number, types, generation, imageUrl, species,
      abilities, stats, description, height, weight,
      url: `${BASE_URL}${relativeUrl}`,
    };
  } catch (err) {
    console.error(`  Error scraping ${relativeUrl}:`, err);
    return null;
  }
}

async function main() {
  const pokemonUrls = await getPokemonList();
  const uniqueUrls = Array.from(new Set(pokemonUrls));
  console.log(`Scraping ${uniqueUrls.length} unique Pokemon...\n`);

  const allPokemon: PokemonData[] = [];

  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i];
    const pokemonName = url.split("/").pop();
    process.stdout.write(`  [${i + 1}/${uniqueUrls.length}] ${pokemonName}...`);

    const data = await scrapePokemon(url);
    if (data) {
      allPokemon.push(data);
      console.log(` OK (${data.types.join("/")})`);
    } else {
      console.log(` SKIP`);
    }

    await sleep(DELAY_MS);
  }

  const outputPath = path.join(__dirname, "..", "data", "pokemon.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allPokemon, null, 2));
  console.log(`\nDone! ${allPokemon.length} Pokemon saved to ${outputPath}`);
}

main().catch(console.error);
