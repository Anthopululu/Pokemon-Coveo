// Quick test script - scrapes a single Pokemon to verify selectors work
import * as cheerio from "cheerio";

async function test() {
  const res = await fetch("https://pokemondb.net/pokedex/pikachu", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PokemonCoveoChallenge/1.0; educational project)",
    },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log("=== Single Pokemon Scrape Test ===\n");
  console.log("Name:", $("h1").first().text().trim());

  // Image from og:image
  console.log("Image:", $('meta[property="og:image"]').attr("content"));

  // Generation from intro paragraph
  const introText = $("main p").first().text();
  const genMatch = introText.match(/Generation (\d+)/);
  console.log(
    "Generation:",
    genMatch ? `Generation ${genMatch[1]}` : "unknown"
  );

  // Vitals table data
  $(".vitals-table")
    .first()
    .find("tr")
    .each((_, row) => {
      const th = $(row).find("th").text().trim();
      if (th.includes("National")) {
        console.log("Number:", $(row).find("td strong").text().trim());
      }
      if (th === "Type") {
        const types: string[] = [];
        $(row)
          .find("td a.type-icon")
          .each((_, a) => {
            types.push($(a).text().trim());
          });
        console.log("Types:", types);
      }
      if (th === "Species") {
        console.log("Species:", $(row).find("td").text().trim());
      }
      if (th === "Height") {
        console.log("Height:", $(row).find("td").text().trim());
      }
      if (th === "Weight") {
        console.log("Weight:", $(row).find("td").text().trim());
      }
      if (th === "Abilities") {
        const abilities: string[] = [];
        $(row)
          .find("td a")
          .each((_, a) => {
            const ability = $(a).text().trim();
            if (ability && ability !== "—") abilities.push(ability);
          });
        console.log("Abilities:", abilities);
      }
    });

  // Stats
  console.log("\nStats:");
  $("table.vitals-table").each((_, table) => {
    $(table)
      .find("tr")
      .each((_, row) => {
        const th = $(row).find("th").text().trim();
        if (
          ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"].includes(
            th
          )
        ) {
          console.log(`  ${th}: ${$(row).find("td").first().text().trim()}`);
        }
      });
  });

  // Description (first Pokedex entry)
  let description = "";
  $("#dex-flavor table.vitals-table tr").each((_, row) => {
    if (!description) {
      const text = $(row).find("td.cell-med-text").text().trim();
      if (text) description = text;
    }
  });
  console.log("\nDescription:", description.substring(0, 100) + "...");
}

test().catch(console.error);
