# Pokedex Search

A Pokemon search engine built for the Coveo Pre-Sales Challenge. Indexes all 1025 Pokemon via the Push API, provides a custom search UI with Coveo Headless, and includes a RAG-powered AI chat assistant.

Live at [pokedexcoveo.com](https://pokedexcoveo.com)

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Coveo](https://img.shields.io/badge/Coveo-Headless-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

---

## Features

**Search engine**
- Full-text + semantic search across 1025 Pokemon via Coveo Cloud
- Faceted filtering by Type and Generation
- Custom autocomplete (title-based, since Query Suggest ML needs traffic to train)
- Sort by relevance, Pokedex number, or name
- URL state sync for shareable searches
- Spelling correction (try "drgaon type")

**AI features**
- Coveo RGA (Relevance Generative Answering) with citations
- Floating RAG chat using Groq (Llama 3.3 70B) + Coveo Passage Retrieval for context
- Streaming responses with conversation history

**LinkedIn import**
- Import real people from LinkedIn as Pokemon characters
- Scraping via Bright Data, instant display via localStorage, indexed to Coveo
- Delete and re-import cycle supported

**UI**
- Pokemon detail pages with stats, abilities, type-colored cards
- Pokemon-themed loading animations (Pokeball wobble)
- Responsive design with mobile facet drawer

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Search | Coveo Headless (14 controllers, 4 utilities, 2 action loaders) |
| Indexing | Coveo Push API |
| Scraping | Bright Data API |
| AI chat | Groq API (Llama 3.3 70B) |
| Passages | Coveo Passage Retrieval API v3 |
| Styling | Tailwind CSS + custom design system |
| Hosting | AWS EC2, PM2, Nginx |

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (fonts, metadata)
│   ├── page.tsx                      # Homepage — initializes Coveo, renders search UI
│   ├── globals.css                   # Design system (CSS variables, gradients, animations)
│   ├── pokemon/[name]/page.tsx       # Detail page — stats, abilities, type badge, passages
│   └── api/
│       ├── chat/route.ts             # POST — Groq chat proxy with SSE streaming
│       └── linkedin/add/route.ts     # POST — Bright Data scrape + Coveo push
│                                     # DELETE — remove document from Coveo index
├── components/
│   ├── SearchWidgets.tsx             # All Coveo widgets: SearchBox, Facet, Pager, GenAI,
│   │                                #   DidYouMean, RecentQueries, StaticFilter, PassageHighlights
│   ├── ResultList.tsx                # Pokemon card grid + pending/deleted LinkedIn logic
│   ├── AddLinkedIn.tsx               # Import button with Pokeball animation
│   └── AIChatPopup.tsx               # Floating AI chat (Coveo context + Groq streaming)
│
└── lib/
    └── coveo.ts                      # Coveo config, engine singleton, useCoveoController hook,
                                      #   Passage Retrieval API, Pokemon type color maps
```

---

## Getting started

### Prerequisites

- Node.js 18+
- A Coveo Cloud organization with a Push source
- API keys for Coveo, Bright Data (optional, for LinkedIn import), and Groq (optional, for AI chat)

### Installation

```bash
git clone https://github.com/Anthopululu/Pokemon-Challenge.git
cd Pokemon-Challenge
npm install
```

### Environment variables

Create `.env.local` at the project root:

```env
# Coveo — search (client-side, exposed to browser)
NEXT_PUBLIC_COVEO_ORG_ID=your-org-id
NEXT_PUBLIC_COVEO_SEARCH_TOKEN=your-search-api-key

# Coveo — Push API (server-side only)
COVEO_ORG_ID=your-org-id
COVEO_API_KEY=your-push-api-key
COVEO_SOURCE_ID=your-push-source-id

# Bright Data — LinkedIn scraping (server-side, optional)
BRIGHT_DATA_API_TOKEN=your-bright-data-token

# Groq — AI chat (server-side, optional)
GROQ_API_KEY=your-groq-api-key
```

> The Push API key must be generated from the Push source page in the Coveo admin console. Manually created API keys with similar permissions won't work.

### Authentication

The LinkedIn import/delete endpoints are protected by a bearer token. Set `ADMIN_TOKEN` in `.env.local` (server-side) and `NEXT_PUBLIC_ADMIN_TOKEN` (client-side, same value) to enable it. If `ADMIN_TOKEN` is not set, the endpoints are open.

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
npm run dev          # Development server at http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Index Pokemon data

The `data/pokemon.json` file contains all 1025 Pokemon scraped from pokemondb.net. To push them to your Coveo source, use the Push API:

```bash
# Example: push a single document
curl -X PUT "https://api.cloud.coveo.com/push/v1/organizations/$COVEO_ORG_ID/sources/$COVEO_SOURCE_ID/documents?documentId=https://pokemondb.net/pokedex/pikachu" \
  -H "Authorization: Bearer $COVEO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Pikachu","data":"...","pokemontype":["Electric"],"pokemonnumber":25}'
```

### Deploy to EC2

```bash
# On the server
git pull
npm run build
pm2 restart pokemon-coveo
```

---

## Coveo Headless usage

The app uses Coveo Headless as its search state layer. Each controller is a live object that subscribes to the engine and auto-updates when search state changes. All controllers share a single engine singleton (except the detail page and chat, which each create their own isolated instance).

**Controllers used:** `buildSearchEngine`, `buildSearchBox`, `buildResultList`, `buildInteractiveResult`, `buildQuerySummary`, `buildFacet`, `buildStaticFilter`, `buildSort`, `buildPager`, `buildResultsPerPage`, `buildGeneratedAnswer`, `buildDidYouMean`, `buildRecentQueriesList`, `buildNotifyTrigger`, `buildUrlManager`

**Action loaders:** `loadSearchActions`, `loadSearchAnalyticsActions`, `loadQueryActions`

**Direct REST:** Passage Retrieval API (`/rest/search/v3/passages/retrieve`) — no Headless controller exists for this endpoint.

The `useCoveoController` hook in `lib/coveo.ts` handles the subscribe/unsubscribe pattern so components stay in sync with the engine without boilerplate.

### Pipeline configuration

A QRE (Query Ranking Expression) boosts `@pokemonnumber<200` by +7000, giving popular Gen 1/2 Pokemon priority in results. Without it, semantic search ranks Pikipek close to Pikachu.

Four ML models are active: Semantic Encoder, RGA, Query Suggestions (empty — needs traffic), and ART (Automatic Relevance Tuning, fed by click tracking via `buildInteractiveResult`).

---

## Design decisions

**Headless over Atomic** — Full control over UI. Atomic provides pre-built components but limits customization. With Headless, the app looks like a Pokedex, not a generic search page.

**Push API over Web Crawler** — More setup work but cleaner metadata. Each Pokemon has typed fields (multi-value types, integer Pokedex number, image URL) instead of raw HTML extraction.

**Custom autocomplete** — The Query Suggest ML model needs real traffic to train. Since this is a demo app, I built title-based suggestions that query the Coveo Search API directly.

**localStorage for instant display** — LinkedIn imports take ~15s to index in Coveo. Pending profiles are stored in localStorage and shown immediately as "Just added" cards, then replaced by real Coveo results once indexed.

**Separate engines** — The detail page and chat each create their own `buildSearchEngine` instance so they don't interfere with the main search state.

---

## Testing

```bash
npm test              # Run all tests once
npm run test:watch    # Run in watch mode
```

Tests cover:
- LinkedIn API route: auth (401 for missing/wrong token), validation (400 for invalid URL), Coveo delete integration
- Chat API route: Groq proxy, streaming response format, conversation history, error handling

---

## Known limitations

- Query Suggest ML model is empty (needs real search traffic to train)
- LinkedIn import depends on Bright Data availability and rate limits
- The 2-minute localStorage TTL for deleted/pending profiles is a workaround — ideally Coveo indexing would be faster
- Admin token is exposed client-side (`NEXT_PUBLIC_ADMIN_TOKEN`) — sufficient for a demo but not for production

---

## License

MIT
