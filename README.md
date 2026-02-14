# Pokedex Search

A Pokemon search app I built for the Coveo Pre-Sales Challenge. The idea was to index all 1000+ Pokemon from pokemondb.net into Coveo Cloud and build a clean search experience with Coveo Headless.

I used Headless instead of Atomic because I wanted more control over the UI. The goal was to make it feel like an actual Pokedex, not just a search page.

## Features

- Full-text search across 1025 Pokemon with Coveo ranking
- Facets for Type and Generation
- Pokemon cards with official artwork
- AI-generated answers via Coveo RGA
- Query suggestions (type-ahead)
- Detail pages with stats, abilities, description
- Responsive (mobile + desktop)
- Sort by relevance or Pokedex number

## Stack

- **Next.js 14** (App Router) + React 18 + Tailwind CSS
- **Coveo Headless** for search
- **Coveo Push API** for indexing
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

## Known limitations

- Query suggestions need a Coveo ML model to be configured in the admin console
- RGA also needs to be enabled in the Coveo admin
- The suggestion dropdown doesn't close when clicking outside (TODO)
