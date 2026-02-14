import { buildSearchEngine, SearchEngine } from "@coveo/headless";
import { coveoConfig } from "./coveo-config";

let engineInstance: SearchEngine | null = null;

export function getSearchEngine(): SearchEngine {
  if (engineInstance) return engineInstance;

  engineInstance = buildSearchEngine({
    configuration: {
      organizationId: coveoConfig.organizationId,
      accessToken: coveoConfig.accessToken,
      search: {
        searchHub: "PokemonSearch",
      },
    },
  });

  return engineInstance;
}
