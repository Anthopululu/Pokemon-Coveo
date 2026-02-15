# Pokedex Search

A Pokemon search app built for the Coveo Pre-Sales Challenge. All 1025 Pokemon from pokemondb.net are indexed into Coveo Cloud, with a fully custom search experience built on Coveo Headless and React.

I chose Headless over Atomic for full UI control. The goal was to make it feel like an actual Pokedex, not a generic search page.

**Live app:** [pokedexcoveo.com](https://pokedexcoveo.com)

---

## Challenge checklist

### Essential

- [x] Accept Cloud Organization invitation
- [x] Install Coveo Headless locally (chose Headless for full React control)
- [x] Index pokemondb.net — used the Push API to index all 1025 Pokemon with structured metadata (types, generation, stats, abilities, images)
- [x] Connect search page to Coveo Cloud endpoint
- [x] Facet to filter by Pokemon Type
- [x] Facet to filter by Pokemon Generation
- [x] Display Pokemon picture directly in search results

### Intermediate

- [x] Code hosted on GitHub
- [x] App hosted and accessible — deployed on AWS EC2 at [pokedexcoveo.com](https://pokedexcoveo.com)

### Advanced

- [x] Coveo RGA deployed — AI-generated answers appear at the top of search results via `buildGeneratedAnswer`
- [x] Type-ahead / autocomplete — the Coveo Query Suggest ML model is empty (not enough search traffic to train), so I built a custom autocomplete that queries the Coveo Search API and suggests matching Pokemon titles in real-time
- [x] Pokemon Detail Page — dedicated page for each Pokemon with stats, abilities, type, height/weight, and official artwork

### Bonus

- [x] Built on the Passage Retrieval API — used in two places:
  1. As context for the RAG chat (feeds relevant text chunks to the LLM)
  2. On detail pages to surface specific passages about each Pokemon

---

## Beyond the requirements

Features I added that were not part of the challenge:

- **Floating AI chat with RAG pipeline** — a chat popup (bottom-right) that runs a Coveo search + Passage Retrieval in parallel, then sends the context + conversation history to Groq's Llama 3.3 70B for answer generation. Streams responses token by token via SSE.
- **15 Coveo Headless controllers** — went deep into the Headless library: `buildSearchBox`, `buildResultList`, `buildFacet`, `buildSort`, `buildPager`, `buildResultsPerPage`, `buildInteractiveResult`, `buildGeneratedAnswer`, `buildDidYouMean`, `buildRecentQueriesList`, `buildNotifyTrigger`, `buildUrlManager`, `buildQuerySummary`, `buildStaticFilter`, `buildTab`
- **URL state sync** — search state is synced to the URL via `buildUrlManager`, so searches can be shared via link
- **Did You Mean** — spelling correction (e.g. "drgaon type" -> "dragon type")
- **Recent Queries** — last 5 searches displayed in the sidebar for quick re-runs
- **Static Filters** — predefined sidebar filters for Starter, Legendary, and Mythical Pokemon
- **Sort options** — sort by relevance, Pokedex number, or name A-Z
- **Results per page** — toggle between 10, 25, or 50 results
- **Interactive Results** — click tracking via `buildInteractiveResult` to feed the ART model
- **Notify Triggers** — pipeline-configured notifications rendered via `buildNotifyTrigger`
- **Type-colored cards** — each Pokemon card has accent colors matching its primary type
- **Responsive layout** — works on mobile and desktop
- **Query Ranking Expression** — added a QRE in the pipeline to boost well-known Pokemon (low Pokedex numbers) so "pika" returns Pikachu before Pikipek

---

## What I learned about Coveo

**Push API vs Web Crawler** — I went with the Push API for full control over indexed metadata. Every Pokemon has properly typed fields (multi-value for types/abilities, integer for Pokedex number) instead of relying on Coveo to parse raw HTML. One gotcha: the API key must be generated from the Push source itself in the admin console — a manually created key with the same permissions didn't work.

**Headless as a state manager** — Headless works like Redux for search. Each controller has its own state and actions, and they all share the same engine. When you select a facet, the result list, query summary, and pager all update automatically. I wrote a thin `useCoveoController` hook to handle subscribe/unsubscribe across all components.

**Query pipelines and ML models** — Four models are associated with my PokemonSearch pipeline: Semantic Encoder, RGA, Query Suggestions, and ART. The pipeline connects to the frontend via `searchHub`. The QRE I added to boost popular Pokemon made a real difference in result quality.

**Passage Retrieval API** — not part of Headless, so I called the REST endpoint directly (`/rest/search/v3/passages/retrieve`). Returns specific text chunks instead of full documents, which made the RAG chat much more accurate.

---

## What didn't work

- **Query Suggest ML model** — the model stays empty because there isn't enough search traffic to train it. Coveo needs real user query data to generate suggestions. I worked around this by building a custom autocomplete that uses the Search API to suggest matching titles directly.
- **Push API key generation** — spent time debugging why my manually created API key wasn't working for the Push API. Turns out you have to generate it from the Push source page itself, not from the general API key settings.

---

## Stack

- Next.js 14 (App Router), React 18, Tailwind CSS
- Coveo Headless for search state management
- Coveo Push API for indexing
- Coveo Passage Retrieval API for text chunk extraction
- Groq API (Llama 3.3 70B) for RAG answer generation in the chat
- AWS EC2 + PM2 + Nginx for hosting

## Setup

```bash
npm install
```

Create `.env.local`:

```
COVEO_ORG_ID=your-org-id
COVEO_API_KEY=your-push-api-key
COVEO_SOURCE_ID=your-source-id
NEXT_PUBLIC_COVEO_ORG_ID=your-org-id
NEXT_PUBLIC_COVEO_SEARCH_TOKEN=your-search-api-key
GROQ_API_KEY=your-groq-api-key
```

### Coveo fields

These need to be created in the Coveo admin (Content > Fields):

| Field | Type | Facet | Multi-value |
|-------|------|-------|-------------|
| pokemontype | String | Yes | Yes |
| pokemongeneration | String | Yes | No |
| pokemonimage | String | No | No |
| pokemonnumber | Integer 64 | No | No |
| pokemonspecies | String | No | No |
| pokemonabilities | String | No | Yes |
| pokemonstats | String | No | No |

### Run

```bash
npm run dev
```
