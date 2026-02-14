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

### Headless

Think of it like Redux but for search. Each "controller" (search box, facet, pager, etc.) has its own state and actions, and they all share the same engine. So when you select a facet, the result list, query summary, and pager all update automatically. I didn't have to wire any of that.

I extracted a `useCoveoController` hook to avoid copy-pasting the subscribe/unsubscribe logic in every component. `ResultList` is the only one that doesn't use it because it needs two controllers at once (results + query summary).

### RGA

Coveo's GenAI answer feature. You create an RGA model + a Semantic Encoder in the admin, associate both to your query pipeline, and on the frontend you just call `buildGeneratedAnswer`. It streams the answer and shows citations. Pretty straightforward once the models are set up.

### Passage Retrieval API

The bonus. Instead of returning full documents, this API returns the specific text chunks that match a query. Headless doesn't have a controller for it so I called the REST endpoint directly (`/rest/search/v3/passages/retrieve`).

I used it on the detail page to pull relevant passages about each Pokemon. Where I see the real value is for customers that have big documentation or knowledge bases - when someone asks a question, you get the exact paragraph instead of a link to a 50-page PDF.

### Query pipelines

This is where everything comes together on the Coveo side. The ML models (RGA, Query Suggestions, Semantic Encoder) are all associated to a pipeline, and the frontend connects to it via the `searchHub`. I only used one pipeline for this project but I can see how you'd set up different ones for different use cases (internal search vs customer-facing, etc.).

## Known limitations

- The suggestion dropdown doesn't close when clicking outside (TODO)
- Passage Retrieval requires a CPR model configured in the admin console
- The detail page creates a new engine instance per visit, which isn't ideal but keeps it simple
