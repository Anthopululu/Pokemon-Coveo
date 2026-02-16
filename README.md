# Pokedex Search

Pokemon search engine I built for the Coveo Pre-Sales Challenge. 1025 Pokemon indexed via the Push API, a search UI with Coveo Headless, and a chat that uses Passage Retrieval + Groq to answer questions about Pokemon.

Live at [pokedexcoveo.com](https://pokedexcoveo.com)

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Coveo](https://img.shields.io/badge/Coveo-Headless-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

---

## Challenge coverage

### Essential (all done)

- [x] Chose Headless over Atomic, wanted full control on the UI so it actually looks like a Pokedex
- [x] Indexed pokemondb.net with a Push source. Wrote a scraper that pulls all 1025 Pokemon with their names, types, stats, abilities, images, etc. Only Pokemon pages, no moves or type pages
- [x] Search page connected to the Coveo Cloud endpoint, search-as-you-type
- [x] Type facet (multi-value, since a Pokemon can be Fire + Flying for example)
- [x] Generation facet (Gen I through IX)
- [x] Pokemon images show directly on the result cards

### Intermediate (all done)

- [x] Code hosted on GitHub
- [x] App hosted on AWS EC2 with PM2 and Nginx

### Advanced (all done)

- [x] Coveo RGA is live. Ask something like "what is the strongest fire type pokemon?" and you get a generative answer with citations above the results
- [x] Query Suggest ML model is active and trained. I also built a custom autocomplete on top that queries the Search API on each keystroke for matching Pokemon names
- [x] Detail page for each Pokemon: image, type badges, stat bars (HP, Attack, Defense...), abilities, height/weight, description, and relevant passages from the index
- [x] Presentation prepared separately

### Bonus (done)

- [x] Passage Retrieval API. I use it in two places: on the detail page to show relevant text about the Pokemon, and in the AI chat where I feed the top passages as context to the LLM so it answers from actual indexed data instead of making things up

### Stuff I added on top of the challenge

- A floating chat popup powered by Coveo RGA that generates answers from the indexed data, streams responses, and shows source citations
- LinkedIn profile import: paste a LinkedIn URL, it scrapes the profile via Bright Data, pushes it to Coveo, and shows it as a Pokemon card in the search results. You can delete imported profiles too
- Bearer token auth on the import/delete API routes
- Sort by relevance, Pokedex number, or name
- Spelling correction ("drgaon" suggests "dragon")
- URL state sync so you can share a filtered search

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Search | Coveo Headless |
| Indexing | Coveo Push API |
| Scraping | Bright Data API |
| AI chat | Coveo RGA (buildGeneratedAnswer) |
| Passages | Coveo Passage Retrieval API v3 |
| Styling | Tailwind CSS |
| Hosting | AWS EC2, PM2, Nginx |

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx                    # root layout, fonts, metadata
│   ├── page.tsx                      # homepage, initializes Coveo and renders search UI
│   ├── globals.css                   # design tokens, gradients, animations
│   ├── pokemon/[name]/page.tsx       # detail page with stats, abilities, passages
│   └── api/
│       ├── chat/route.ts             # POST: chat endpoint (legacy, unused)
│       └── linkedin/add/route.ts     # POST: Bright Data scrape + Coveo push
│                                     # DELETE: remove document from Coveo index
├── components/
│   ├── SearchWidgets.tsx             # SearchBox, Facet, Pager, GenAI, DidYouMean,
│   │                                #   RecentQueries, StaticFilter, PassageHighlights
│   ├── ResultList.tsx                # Pokemon card grid + pending/deleted LinkedIn logic
│   ├── AddLinkedIn.tsx               # import button with Pokeball animation
│   └── AIChatPopup.tsx               # floating chat powered by Coveo RGA
│
└── lib/
    └── coveo.ts                      # config, engine singleton, useCoveoController hook,
                                      #   Passage Retrieval, type color maps
```

---

## Getting started

### Prerequisites

- Node.js 18+
- A Coveo Cloud organization with a Push source
- API keys for Coveo, Bright Data (optional, for LinkedIn), and Groq (optional, for chat)

### Installation

```bash
git clone https://github.com/Anthopululu/Pokemon-Coveo.git
cd Pokemon-Coveo
npm install
```

### Environment variables

Create `.env.local` at the project root:

```env
# Coveo search (client-side, exposed to browser)
NEXT_PUBLIC_COVEO_ORG_ID=your-org-id
NEXT_PUBLIC_COVEO_SEARCH_TOKEN=your-search-api-key

# Coveo Push API (server-side only)
COVEO_ORG_ID=your-org-id
COVEO_API_KEY=your-push-api-key
COVEO_SOURCE_ID=your-push-source-id

# Bright Data, for LinkedIn scraping (server-side, optional)
BRIGHT_DATA_API_TOKEN=your-bright-data-token

# Groq, for AI chat (server-side, optional)
GROQ_API_KEY=your-groq-api-key
```

The Push API key has to be generated from the Push source page in the Coveo admin console. Manually created API keys with similar permissions won't work (learned that the hard way).

### Authentication

The LinkedIn import/delete endpoints are protected by a bearer token. Set both `ADMIN_TOKEN` (server-side) and `NEXT_PUBLIC_ADMIN_TOKEN` (client-side, same value) in `.env.local`. If `ADMIN_TOKEN` is not set, the endpoints are open.

```env
ADMIN_TOKEN=choose-a-strong-random-token
NEXT_PUBLIC_ADMIN_TOKEN=choose-a-strong-random-token  # same value
```

### Coveo fields

Create these fields in the Coveo admin (Content > Fields):

| Field | Type | Facet | Multi-value |
|-------|------|-------|-------------|
| `pokemontype` | String | Yes | Yes |
| `pokemongeneration` | String | Yes | No |
| `pokemonimage` | String | No | No |
| `pokemonnumber` | Integer 64 | No | No |
| `pokemonspecies` | String | No | No |
| `pokemonabilities` | String | No | Yes |
| `pokemonstats` | String | No | No |
| `pokemoncategory` | String | No | No |

### Run locally

```bash
npm run dev          # dev server at http://localhost:3000
npm run build        # production build
npm run start        # start production server
npm run lint         # ESLint
```

### Scrape and index Pokemon data

Two scripts in `scripts/`:

```bash
npx tsx scripts/scrape-pokemon.ts    # scrape pokemondb.net -> data/pokemon.json
npx tsx scripts/push-to-coveo.ts     # push data/pokemon.json -> Coveo
```

The scraper goes through all 1025 Pokemon pages on pokemondb.net, parses the HTML with cheerio, and saves everything (name, types, stats, abilities, image, etc.) to `data/pokemon.json`. The push script reads that file and sends each document to Coveo via the Push API.

### Deploy

```bash
git pull
npm run build
pm2 restart pokemon-coveo
```

---

## How Headless is used

The app uses Coveo Headless for all search state management. Each controller subscribes to a shared engine singleton and auto-updates on state changes. The detail page and chat create their own isolated engines so they don't mess with the main search.

Controllers: `buildSearchEngine`, `buildSearchBox`, `buildResultList`, `buildInteractiveResult`, `buildQuerySummary`, `buildFacet`, `buildStaticFilter`, `buildSort`, `buildPager`, `buildResultsPerPage`, `buildGeneratedAnswer`, `buildDidYouMean`, `buildRecentQueriesList`, `buildNotifyTrigger`, `buildUrlManager`

Action loaders: `loadSearchActions`, `loadSearchAnalyticsActions`, `loadQueryActions`

For Passage Retrieval I call the REST endpoint directly (`/rest/search/v3/passages/retrieve`) since there's no Headless controller for it.

The `useCoveoController` hook in `lib/coveo.ts` handles subscribe/unsubscribe so components stay in sync without boilerplate.

### Pipeline config

I have a QRE that boosts `@pokemonnumber<200` by +7000 so popular Gen 1/2 Pokemon show up first. Without it, searching "Pikachu" also ranks Pikipek pretty high because of semantic similarity.

Four ML models are active: Semantic Encoder, RGA, Query Suggestions, and ART (Automatic Relevance Tuning, fed by click analytics from `buildInteractiveResult`).

---

## Why I made certain choices

I went with Headless instead of Atomic because I wanted the UI to look like an actual Pokedex, not a default search interface. More work but the result is way more custom.

Push API instead of the Web Crawler because I get cleaner metadata that way. Each Pokemon has typed fields (multi-value types, integer Pokedex number, image URL) instead of having to extract stuff from raw HTML.

I also added a custom autocomplete that queries the Search API directly on each keystroke and shows matching titles, on top of the Query Suggest model.

LinkedIn imports take about 15 seconds to index in Coveo, so I store pending profiles in localStorage and show them as "Just added" cards immediately. Once Coveo finishes indexing, the real results replace them.

---

## Testing

```bash
npm test              # run all tests
npm run test:watch    # watch mode
```

Tests cover the LinkedIn API route (auth, validation, Coveo delete) and the chat API route (Groq proxy, streaming, conversation history, error handling).

---

## Known limitations

- LinkedIn import depends on Bright Data availability
- The 2-minute localStorage TTL for deleted/pending profiles is a workaround, ideally Coveo indexing would be faster
- Admin token is exposed client-side (`NEXT_PUBLIC_ADMIN_TOKEN`), fine for a demo but not for production

---

## License

MIT
