# Pokedex Search

A Pokemon search app I built for the Coveo Pre-Sales Challenge. I scraped all 1025 Pokemon from pokemondb.net, pushed them into Coveo Cloud via the Push API, and built a search UI on top of Coveo Headless.

I picked Headless over Atomic because I wanted to control the UI myself. Atomic gives you pre-built components, which is fine, but I wanted it to actually look like a Pokedex.

Live at [pokedexcoveo.com](https://pokedexcoveo.com)

---

## Challenge requirements

### Essential

- [x] Accept Cloud Organization invitation
- [x] Install Headless locally
- [x] Index pokemondb.net (Push API, 1025 Pokemon with typed metadata)
- [x] Connect search page to Coveo Cloud
- [x] Facet for Pokemon Type
- [x] Facet for Pokemon Generation
- [x] Pokemon picture in search results

### Intermediate

- [x] Code on GitHub
- [x] App hosted and accessible (AWS EC2 at [pokedexcoveo.com](https://pokedexcoveo.com))

### Advanced

- [x] Coveo RGA deployed (AI answers at the top of results via `buildGeneratedAnswer`)
- [x] Type-ahead autocomplete (the Query Suggest ML model never trained because there wasn't enough search traffic, so I built my own autocomplete that hits the Coveo Search API and shows matching Pokemon titles)
- [x] Pokemon Detail Page (stats, abilities, type, height/weight, artwork)

### Bonus

- [x] Passage Retrieval API, used in two places: as context for the RAG chat, and on detail pages to show relevant passages about each Pokemon

---

## Stuff I added on top

Things that weren't in the challenge but felt right:

A floating chat in the bottom-right corner. It runs a Coveo search and Passage Retrieval call in parallel, bundles the results as context, and sends everything to Groq's Llama 3.3 70B. Responses stream back token by token. The chat keeps conversation history (up to 10 messages) so you can ask follow-up questions.

URL sync with `buildUrlManager` so you can share a search by copying the URL. Spelling correction with `buildDidYouMean` (try typing "drgaon type"). Recent queries in the sidebar via `buildRecentQueriesList`. Static filters for Starter/Legendary/Mythical Pokemon. Sort by relevance, Pokedex number, or name. Results per page toggle (10/25/50). Click tracking via `buildInteractiveResult` to feed Coveo's ART model. Each Pokemon card has accent colors based on its primary type.

I also added a QRE (Query Ranking Expression) in the Coveo pipeline to boost well-known Pokemon. Without it, searching "pika" sometimes returned Pikipek before Pikachu because the embeddings were close. The QRE gives a score boost to lower Pokedex numbers, which fixed that.

---

## All Coveo Headless functions used

Here is everything I imported from `@coveo/headless`, and where each one lives in the code:

| Function | File | What it does |
|----------|------|-------------|
| `buildSearchEngine` | coveo-engine.ts, detail page, chat | Creates the engine. Everything else plugs into it. |
| `buildSearchBox` | SearchBox.tsx | Search input. I disabled native query suggestions (model is empty) and built custom autocomplete on top. |
| `buildResultList` | ResultList.tsx, detail page, chat | Fetches results. I specify which custom fields to include so the cards have everything they need. |
| `buildFacet` | Facet.tsx | Used twice: one for Type, one for Generation. |
| `buildPager` | Pager.tsx | Page navigation at the bottom. |
| `buildSort` | Sort.tsx | Sort dropdown. |
| `buildRelevanceSortCriterion` | Sort.tsx | Default sort by relevance. |
| `buildFieldSortCriterion` | Sort.tsx | Sort by pokemonnumber or title. |
| `buildCriterionExpression` | Sort.tsx | Converts a sort criterion to a string to compare with the active sort. |
| `buildResultsPerPage` | ResultsPerPage.tsx | Toggle between 10, 25, 50 results. |
| `buildInteractiveResult` | PokemonCard.tsx | Wraps each card and tracks clicks/hovers. This is what feeds Coveo's ART model. |
| `buildGeneratedAnswer` | GenAIAnswer.tsx | Coveo RGA. Shows an AI answer at the top of results with citations. |
| `buildDidYouMean` | DidYouMean.tsx | Spelling correction. |
| `buildRecentQueriesList` | RecentQueries.tsx | Last 5 searches in the sidebar. |
| `buildStaticFilter` | StaticFilter.tsx | Predefined filters (Starter, Legendary, Mythical). |
| `buildStaticFilterValue` | StaticFilter.tsx | Each individual filter value inside the static filter. |
| `buildNotifyTrigger` | NotifyTrigger.tsx | Renders pipeline notifications. |
| `buildUrlManager` | SearchUrlManager.tsx | Syncs search state to the URL hash. |
| `buildQuerySummary` | QuerySummary.tsx | "Results 1-10 of 152 for Pikachu - 0.23s" line. |
| `loadSearchActions` | page.tsx | Dispatches the initial search on page load. |
| `loadSearchAnalyticsActions` | page.tsx | Logs the interface load event for analytics. |

Outside of Headless, I also call the Passage Retrieval REST API directly (`/rest/search/v3/passages/retrieve`) since there is no Headless controller for it.

---

## What I learned

I went with the Push API instead of the Web Crawler. More work up front (wrote a scraper, mapped fields manually) but the payoff is clean metadata. Every Pokemon has multi-value fields for types and abilities, an integer for the Pokedex number, and a proper image URL. The crawler would have given me raw HTML and I'd be fighting with extraction rules.

One thing that tripped me up: the Push API key has to be generated from the Push source page in the admin console. I spent time creating an API key manually with what looked like the right permissions, and it just wouldn't authenticate. Turns out you need the one the source generates for you.

Headless is basically Redux for search. Each controller owns its slice of state, and they all share one engine. Select a facet, and the result list, query summary, and pager all react automatically. I wrote a small `useCoveoController` hook to handle the subscribe/unsubscribe pattern so I wouldn't repeat it in every component.

The four ML models on my pipeline are Semantic Encoder, RGA, Query Suggestions, and ART. The Semantic Encoder is what makes "fire breathing lizard" return Charizard. The QRE I added on top of ART was necessary because semantic search alone doesn't account for popularity.

---

## What didn't work

The Query Suggest ML model is empty. It needs real search traffic to train, and since nobody is actually using this app regularly, there is no data for it to learn from. I could have pre-seeded it with synthetic queries, but that felt like gaming it. Instead I built a custom autocomplete that just searches the index and shows matching titles.

---

## Stack

- Next.js 14 (App Router), React 18, Tailwind CSS
- Coveo Headless for search state management
- Coveo Push API for indexing
- Coveo Passage Retrieval API for text chunks
- Groq API (Llama 3.3 70B) for the RAG chat
- AWS EC2, PM2, Nginx

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

Create these in the Coveo admin (Content > Fields):

| Field | Type | Facet | Multi-value |
|-------|------|-------|-------------|
| pokemontype | String | Yes | Yes |
| pokemongeneration | String | Yes | No |
| pokemonimage | String | No | No |
| pokemonnumber | Integer 64 | No | No |
| pokemonspecies | String | No | No |
| pokemonabilities | String | No | Yes |
| pokemonstats | String | No | No |

```bash
npm run dev
```
