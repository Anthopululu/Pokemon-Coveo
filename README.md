# Pokedex Search

A Pokemon search app I built for the Coveo Pre-Sales Challenge. I indexed all 1025 Pokemon from pokemondb.net into Coveo Cloud and built a custom search experience using Coveo Headless.

I went with Headless over Atomic because I wanted full control over the UI. The idea was to make it feel like an actual Pokedex, not just a generic search page.

## What it does

- Full-text search across 1025 Pokemon with Coveo ranking
- Facets for Type and Generation
- Pokemon cards with official artwork and type-colored accents
- Floating AI chat popup with RAG (Coveo search + Groq Llama 3.3 70B for answer generation)
- Passage Retrieval API feeding context into the chat and on detail pages
- Query suggestions / type-ahead
- Detail pages with base stats, abilities, height/weight
- Responsive layout (mobile + desktop)

## Stack

- Next.js 14 (App Router), React 18, Tailwind CSS
- Coveo Headless for search state management
- Coveo Push API for indexing
- Coveo Passage Retrieval API for text chunk extraction
- Groq API (Llama 3.3 70B) for RAG answer generation in the chat
- cheerio for scraping pokemondb.net

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

### Index data

```bash
npm run scrape    # scrape pokemondb.net (~7 min)
npm run push      # push to Coveo
```

### Run

```bash
npm run dev
```

## How it works

The scraper (`scripts/scrape-pokemon.ts`) crawls pokemondb.net/pokedex/national, visits each Pokemon page, and pulls out name, types, stats, abilities, images etc. using cheerio.

The push script (`scripts/push-to-coveo.ts`) takes the scraped JSON and sends each Pokemon as a document to a Coveo Push source with custom metadata fields.

On the frontend, each Coveo Headless controller (search box, facets, result list, etc.) is wired up through a `useCoveoController` hook that handles subscribe/unsubscribe. The detail page spins up its own engine instance to query one Pokemon without touching the main search state.

### AI chat

The floating chat (bottom-right) is a RAG pipeline that works in three steps:

1. Runs a Coveo search and Passage Retrieval in parallel to gather context
2. Sends the query + context to Groq's Llama 3.3 70B via a Next.js API route (`/api/chat`)
3. Streams the response back token by token

The API route is a thin proxy that forwards to Groq's OpenAI-compatible endpoint. Streaming is SSE (Server-Sent Events), parsed client-side chunk by chunk.

If the LLM call fails, a basic fallback formats the top Coveo result into a sentence.

### Passage Retrieval

Instead of returning full documents, this API returns the specific text chunks that answer a query. Headless doesn't have a controller for it, so I called the REST endpoint directly (`/rest/search/v3/passages/retrieve`).

I use it in two places:
1. As context for the RAG chat, so the LLM has sourced text to work with.
2. On the detail page to surface relevant passages about each Pokemon.

## What I learned about Coveo

### Push API vs Web Crawler

I went with the Push API. The Web Crawler would have been simpler to set up but I wanted control over what gets indexed and how the metadata is structured. I scraped the data myself and pushed exactly what I needed with the right field mappings. More work upfront, but the result is cleaner: every Pokemon has properly typed fields (multi-value for types and abilities, integer for Pokedex number) instead of relying on Coveo to figure that out from raw HTML.

One thing that got me: the API key has to be generated from the Push source itself in the admin console. A manually created API key with the same permissions didn't work. Took me a while to figure that out.

### Headless

Think of it like Redux but for search. Each controller (search box, facet, pager, etc.) has its own state and actions, and they all share the same engine. When you select a facet, the result list, query summary, and pager all update automatically. I didn't have to wire any of that myself.

I made a `useCoveoController` hook to avoid duplicating the subscribe/unsubscribe logic across components. Keeps things clean.

### Query pipelines and ranking

The ML models (Query Suggestions, Semantic Encoder) are associated to a pipeline, and the frontend connects via `searchHub`. I also added a QRE (Query Ranking Expression) in the pipeline to boost well-known Pokemon (low Pokedex numbers) so that searching "pika" returns Pikachu before Pikipek. Without it, Coveo's semantic/vector search sometimes ranked less popular Pokemon higher because of closer embedding similarity.
