# Pokedex Search

A Pokemon search app I built for the Coveo Pre-Sales Challenge. I indexed all 1025 Pokemon from pokemondb.net into Coveo Cloud and built a custom search experience using Coveo Headless.

I went with Headless over Atomic because I wanted full control over the UI. The idea was to make it feel like an actual Pokedex, not just a generic search page.

## What it does

- Full-text search across 1025 Pokemon with Coveo ranking
- Facets for Type and Generation
- Pokemon cards with official artwork
- AI-generated answers (Coveo RGA) inline + a floating AI chat popup
- Query suggestions / type-ahead
- Detail pages with base stats, abilities, height/weight
- Passage Retrieval API on detail pages (bonus)
- Sort by relevance or Pokedex number
- Responsive layout (mobile + desktop)

## Stack

- Next.js 14 (App Router), React 18, Tailwind CSS
- Coveo Headless for search state management
- Coveo Push API for indexing
- Coveo Passage Retrieval API for text chunk extraction
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

There is also a floating AI chat popup (bottom-right corner) that creates a dedicated engine per conversation query, runs it through Coveo RGA, and shows the generated answer with clickable Pokemon cards inline.

## What I learned about Coveo

### Push API vs Web Crawler

I went with the Push API. The Web Crawler would have been simpler to set up but I wanted control over what gets indexed and how the metadata is structured. I scraped the data myself and pushed exactly what I needed with the right field mappings. More work upfront, but the result is cleaner: every Pokemon has properly typed fields (multi-value for types and abilities, integer for Pokedex number) instead of relying on Coveo to figure that out from raw HTML.

One thing that got me: the API key has to be generated from the Push source itself in the admin console. A manually created API key with the same permissions didn't work. Took me a while to figure that out.

### Headless

Think of it like Redux but for search. Each controller (search box, facet, pager, etc.) has its own state and actions, and they all share the same engine. When you select a facet, the result list, query summary, and pager all update automatically. I didn't have to wire any of that myself.

I made a `useCoveoController` hook to avoid duplicating the subscribe/unsubscribe logic across components. Keeps things clean.

### RGA (Relevance Generative Answering)

This is Coveo's GenAI answer feature. You create an RGA model and a Semantic Encoder in the admin, associate both to your query pipeline, and on the frontend you call `buildGeneratedAnswer`. It streams the answer and shows citations.

I use it in two places: inline on the search page (the blue box that appears when Coveo has a generated answer), and in the floating AI chat popup where it powers the conversational responses.

### Passage Retrieval API

The bonus item. Instead of returning full documents, this API returns the specific text chunks that match a query. Headless doesn't have a controller for it, so I called the REST endpoint directly (`/rest/search/v3/passages/retrieve`).

I used it on the detail page to surface relevant passages about each Pokemon. Where I think this really shines is for customers with large documentation or knowledge bases. When someone asks a question, you get the exact paragraph instead of a link to a 50-page PDF. That's a much better experience for support portals, internal wikis, or any self-service scenario.

### Query pipelines

This is where everything comes together on the Coveo side. The ML models (RGA, Query Suggestions, Semantic Encoder) are all associated to a pipeline, and the frontend connects to it via the `searchHub`. I only used one pipeline here but you'd set up different ones for different contexts (internal search vs customer-facing, etc.).

## Known limitations

- Passage Retrieval requires a CPR model configured in the admin console
- The detail page creates a new engine instance per visit (keeps it simple but not ideal for production)
