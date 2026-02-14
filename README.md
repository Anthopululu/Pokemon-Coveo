# Pokedex Search

A Pokemon search app I built for the Coveo Pre-Sales Challenge. The idea was to index all 1000+ Pokemon from pokemondb.net into Coveo Cloud and build a search experience with Coveo Headless.

I used Headless instead of Atomic because I wanted more control over the UI. The goal was to make it feel like an actual Pokedex, not just a search page.

## Features

- Full-text search across 1025 Pokemon with Coveo ranking
- Facets for Type and Generation
- Pokemon cards with official artwork
- AI-generated answers via Coveo RGA
- Query suggestions (type-ahead)
- Detail pages with stats, abilities, description
- Passage Retrieval API integration on detail pages
- Responsive (mobile + desktop)
- Sort by relevance or Pokedex number

## Stack

- **Next.js 14** (App Router) + React 18 + Tailwind CSS
- **Coveo Headless** for search state management
- **Coveo Push API** for indexing
- **Coveo Passage Retrieval API** for extracting relevant text chunks
- **cheerio** for scraping pokemondb.net

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
```

### Coveo fields

Create these in Coveo admin (Content > Fields):

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

The scraper (`scripts/scrape-pokemon.ts`) crawls pokemondb.net/pokedex/national, visits each Pokemon page, and extracts name, types, stats, abilities, images etc. using cheerio.

The push script (`scripts/push-to-coveo.ts`) takes the scraped JSON and pushes each Pokemon as a document to a Coveo Push source with custom metadata fields.

On the frontend, each Coveo Headless controller (search box, facets, result list, etc.) is wired up via a custom `useCoveoController` hook that handles the subscribe/unsubscribe lifecycle. The detail page uses a separate engine instance to query a specific Pokemon without affecting the main search state.

## What I learned about Coveo

### Push API vs Web Crawler

I went with the Push API instead of the Web Crawler. The Web Crawler would have been simpler to set up but I would have had less control over what gets indexed and how the metadata is structured. With the Push API, I scraped the data myself and pushed exactly what I needed with the right field mappings. It took more work but the result is cleaner - every Pokemon has properly typed fields (multi-value for types and abilities, integer for pokedex number) instead of relying on Coveo to figure out the metadata from raw HTML.

One thing that tripped me up: the API key has to be generated directly from the Push source in the admin console. A manually created API key with the same permissions didn't work. Took me a while to figure that out.

### Headless architecture

Headless is basically a state management layer for search. Each "controller" (search box, facet, pager, etc.) is a standalone object with its own state and actions. You subscribe to state changes and render however you want. It's the same idea as Redux or Zustand but specifically for search.

The nice thing is that everything stays in sync automatically. When you select a facet value, the result list updates, the query summary updates, the pager resets to page 1 - all because they share the same engine. I didn't have to wire any of that manually.

I ended up extracting a `useCoveoController` hook to avoid repeating the subscribe/unsubscribe boilerplate in every component. The only component that doesn't use it is `ResultList` because it needs two controllers at once (results + query summary).

### RGA (Relevance Generative Answering)

RGA is Coveo's GenAI answer feature. It takes the search results and generates a natural language answer using an LLM, with citations back to the source documents. In the admin console you need to create both an RGA model and a Semantic Encoder model, then associate them to your query pipeline.

On the frontend, you just use `buildGeneratedAnswer` from Headless and it handles the streaming response. The component shows up when the model has enough context to generate an answer, otherwise it stays hidden.

### Passage Retrieval API

This was the bonus feature. Instead of returning full documents, the Passage Retrieval API returns specific text chunks that are relevant to a query. It's a direct REST call to `/rest/search/v3/passages/retrieve` since Headless doesn't have a built-in controller for it.

I used it on the detail page to pull relevant passages about each Pokemon. In a real enterprise context, this would be useful for long technical docs or knowledge bases where the answer is buried in a 50-page PDF. The API finds the exact paragraph instead of making the user scroll through the whole document.

### Query pipelines

The query pipeline is where you configure how search behaves. You associate ML models (RGA, Query Suggestions, Semantic Encoder) to it, set up ranking rules, and define conditions. Everything on my frontend points to the same pipeline through the `searchHub: "PokemonSearch"` configuration.

## Known limitations

- The suggestion dropdown doesn't close when clicking outside (TODO)
- Passage Retrieval requires a CPR model configured in the admin console
- The detail page creates a new engine instance per visit, which isn't ideal but keeps it simple
