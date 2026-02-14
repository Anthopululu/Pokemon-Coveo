import { coveoConfig } from "./coveo-config";

interface PassageDocument {
  title: string;
  primaryid: string;
  clickableuri?: string;
}

export interface Passage {
  text: string;
  relevanceScore: number;
  document: PassageDocument;
}

interface PassageResponse {
  items: Passage[];
  responseId?: string;
}

export async function retrievePassages(query: string): Promise<Passage[]> {
  const url = `https://${coveoConfig.organizationId}.org.coveo.com/rest/search/v3/passages/retrieve`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${coveoConfig.accessToken}`,
      },
      body: JSON.stringify({
        query,
        additionalFields: ["clickableuri", "pokemontype"],
        maxPassages: 3,
        searchHub: "PokemonSearch",
      }),
    });

    if (!res.ok) return [];

    const data: PassageResponse = await res.json();
    return data.items || [];
  } catch {
    // API might not be available if no CPR model is configured
    return [];
  }
}
