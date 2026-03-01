# Pokedex Search

Pokemon search engine I built for the Coveo SE Challenge. 1025 Pokemon indexed through the Push API, a custom Pokedex UI on Coveo Headless, and an AI chat grounded on real indexed data.

**Live demo: [https://pokedexcoveo.com](https://pokedexcoveo.com)**

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Coveo](https://img.shields.io/badge/Coveo-Headless-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

---

## What this project does

The idea was simple: take Coveo's search platform and build something that actually looks good with it. Not a default search page, a real Pokedex you'd want to use.

I scraped all 1025 Pokemon from pokemondb.net, pushed them into a Coveo source with typed fields (multi-value types, stats as JSON, image URLs), and built a Next.js frontend with Coveo Headless that ties everything together. You can search, filter by type or generation, sort by Pokedex number, and get AI-generated answers about any Pokemon.

On top of that, I added a LinkedIn import feature as a bonus. Paste someone's LinkedIn URL, the app scrapes it via Bright Data, pushes the profile to the same Coveo index, and it shows up as a Pokemon card in the results. It's weird and fun and it shows the Push API works for any data source.

---

## Why Headless over Atomic

I went with Headless because I wanted full control on the UI. Atomic gives you pre-built components that look like a standard search page, which is fine for enterprise use cases, but a Pokedex should look like a Pokedex.

With Headless I manage 14 functions (SearchBox, ResultList, Facet, Sort, Pager, RGA, DidYouMean, etc.) through a shared engine singleton. More plumbing, but the end result is a fully custom interface where every card, every filter, every animation is mine.

---

## Key features

**Search & discovery**
- Search-as-you-type connected to Coveo Cloud
- Type facet (multi-value, since a Pokemon can be Fire + Flying) and Generation facet
- Custom autocomplete that queries the Search API on each keystroke
- Query Suggest ML model trained on user queries
- Spelling correction ("drgaon" suggests "dragon")
- URL state sync so you can share a filtered search

**AI answers**
- Coveo RGA (Relevance Generative Answering) shows AI-generated answers above results with source citations
- Floating chat popup that streams answers grounded on Passage Retrieval data
- No hallucination: the AI only knows what's in the index

**Pokemon detail pages**
- Stats bars (HP, Attack, Defense, Speed...), type badges, abilities, height/weight
- Passage Retrieval pulls relevant text snippets from the index

**LinkedIn import (bonus)**
- Paste a LinkedIn URL, it gets scraped via Bright Data and pushed to Coveo
- Shows up as a Pokemon card with the person's name, company, and role
- Optimistic UI: card appears instantly, Coveo indexes in ~15s behind the scenes
- Bearer token auth on the API routes

---

## Tech stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Search**: Coveo Headless (14 functions + shared engine)
- **Indexing**: Coveo Push API
- **AI**: Coveo RGA + Passage Retrieval API v3
- **LinkedIn scraping**: Bright Data API
- **Hosting**: AWS EC2, PM2, Nginx
- **Tests**: Vitest

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                      # search page, initializes Coveo engine
│   ├── pokemon/[name]/page.tsx       # detail page with stats, passages, type badges
│   └── api/
│       └── linkedin/add/route.ts     # Bright Data scrape + Coveo push/delete
├── components/
│   ├── SearchWidgets.tsx             # SearchBox, Facet, Pager, RGA, DidYouMean...
│   ├── ResultList.tsx                # Pokemon card grid
│   ├── AddLinkedIn.tsx               # LinkedIn import with Pokeball animation
│   └── AIChatPopup.tsx               # floating chat powered by Coveo RGA
└── lib/
    └── coveo.ts                      # engine singleton, config, Passage Retrieval,
                                      # useCoveoController hook, type color maps
scripts/
├── scrape-pokemon.ts                 # scrapes pokemondb.net, saves to data/pokemon.json
└── push-to-coveo.ts                  # pushes pokemon.json to Coveo Push API
```

---

## Getting started

### Prerequisites

- Node.js 18+
- A Coveo org with a Push source

### Install and run

```bash
git clone https://github.com/Anthopululu/Pokemon-Coveo.git
cd Pokemon-Coveo
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                   # http://localhost:3000
```

### Environment variables

```env
NEXT_PUBLIC_COVEO_ORG_ID=your-org-id
NEXT_PUBLIC_COVEO_SEARCH_TOKEN=your-search-api-key
COVEO_ORG_ID=your-org-id
COVEO_API_KEY=your-push-api-key          # generate from the Push source page, not from API keys
COVEO_SOURCE_ID=your-push-source-id
BRIGHT_DATA_API_TOKEN=your-token         # optional, for LinkedIn import
ADMIN_TOKEN=your-secret                  # optional, protects import/delete routes
NEXT_PUBLIC_ADMIN_TOKEN=your-secret      # same value, client-side
```

One gotcha: the Push API key has to come from the Push source page in the Coveo admin. Regular API keys with similar permissions don't work (I lost time on that one).

### Index the Pokemon data

```bash
npx tsx scripts/scrape-pokemon.ts    # scrapes pokemondb.net
npx tsx scripts/push-to-coveo.ts     # pushes to Coveo
```

### Coveo field setup

Create these in Content > Fields:

- `pokemontype` (String, facet, multi-value) for type filters like Fire, Water
- `pokemongeneration` (String, facet) for generation filters
- `pokemonimage` (String) for artwork URLs
- `pokemonnumber` (Integer 64, sortable) for Pokedex number sorting
- `pokemonspecies` (String) for species description
- `pokemonabilities` (String, multi-value) displayed on detail pages
- `pokemonstats` (String) JSON blob with stats, evo chain, defenses
- `pokemoncategory` (String) to distinguish People vs Pokemon

### API keys

I created 6 API keys during development, each for a specific need:

- **push** (Push API): indexes and deletes documents from the app's server-side routes
- **Pokemon Search** (Search pages): client-side search token used by the frontend
- **analytic** (Usage analytics): click analytics for ART model training
- **Machine learning** (Custom): initial setup of ML models (Semantic Encoder, QS, RGA)
- **PokemonChallengeSource** (Push API, auto-generated): came with the Push source, used for initial indexing
- **Pokemon Admin Key** (Custom): org-level configuration during setup

In production, only 2 keys are active: **push** for server-side indexing and **Pokemon Search** for client-side search. The others were needed during build but can be cleaned up once the app is live.

### Pipeline config

One QRE that boosts `@pokemonnumber<200` by +7000 so Gen 1/2 Pokemon rank higher. Without it, "Pikachu" also pushes Pikipek up because of semantic similarity. Four ML models active: Semantic Encoder, RGA, Query Suggestions, ART.

---

## How Headless fits together

All search state goes through a shared Coveo engine in `lib/coveo.ts`. Each component subscribes to it via `useCoveoController`, a custom React hook that handles subscribe/unsubscribe so you don't write boilerplate.

The detail page and AI chat create their own isolated engines so they don't interfere with the main search.

For Passage Retrieval I hit the REST endpoint directly (`/rest/search/v3/passages/retrieve`) since there's no Headless function for it yet.

**Functions used:** SearchBox, ResultList, InteractiveResult, QuerySummary, Facet, StaticFilter, Sort, Pager, ResultsPerPage, GeneratedAnswer, DidYouMean, RecentQueriesList, NotifyTrigger, UrlManager

**Action loaders:** loadSearchActions, loadSearchAnalyticsActions, loadQueryActions

---

## Testing

```bash
npm test
```

Covers the LinkedIn API route (auth, validation, push, delete).

---

## Deploy

```bash
git pull && npm run build && pm2 restart pokemon-coveo
```

Running on EC2 behind Nginx with PM2 for process management.

---

## Known trade-offs

- LinkedIn import takes ~15s to index in Coveo, so I use localStorage for instant feedback. It's a workaround, not ideal
- Admin token is exposed client-side, fine for a demo but not for production
- Bright Data availability can be flaky for LinkedIn scraping
- Scraper relies on pokemondb.net's HTML structure (CSS selectors). If they redesign their pages, the scraper breaks with no fallback

---

## License

MIT
