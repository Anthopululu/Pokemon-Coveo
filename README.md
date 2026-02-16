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

I also added a QRE (Query Ranking Expression) in the Coveo pipeline: `@pokemonnumber<200` with a +7000 score boost. It gives a ranking advantage to the first 200 Pokemon (Gen 1 + part of Gen 2), which are generally the most searched. Without it, searching "pika" returned Pikipek (#731) close to Pikachu (#25) because their embeddings were similar. With the QRE, Pikachu scores 8007 and Pikipek drops to 1678. Not a perfect proxy for popularity, but good enough for this use case.

---

## Coveo Headless usage

The app uses 14 controllers, 4 utility functions, 2 action loaders, and 1 direct REST call. Quick distinction:

- **Controller** — a live object that keeps track of things and updates on its own. `buildFacet` knows which filters are checked and how many results each one has, and it stays in sync as the user searches.
- **Utility function** — a helper that builds a config object. You call it once, get a value back, pass it somewhere, done. Nothing lives after that.
- **Action loader** — gives you a function you can fire once to make something happen, like triggering the first search when the page loads.
- **REST call** — a regular HTTP request to a Coveo endpoint that Headless doesn't have a controller for.

### Controllers

I subscribe to each controller via a `useCoveoController` hook (in `lib/coveo.ts`) that handles subscribe/unsubscribe.

`buildSearchEngine` (lib/coveo.ts, detail page, chat) — the engine itself. Not technically a controller, but everything else plugs into it. I create three separate instances: one for the main search page, one for the detail page, and one for the chat popup. Each engine is an independent search context, so navigating to a detail page doesn't reset the main search.

`buildSearchBox` (SearchBox.tsx) — manages the search input text and triggers queries. It normally handles query suggestions too, but mine are disabled (`numberOfSuggestions: 0`) because the Query Suggest ML model is empty. I built a custom autocomplete on top that queries the Coveo Search API directly.

`buildResultList` (ResultList.tsx, detail page, chat) — fetches results from the engine. I pass a list of custom fields to include (`pokemontype`, `pokemonnumber`, `pokemonimage`, etc.) so the cards get all their data in one call.

`buildInteractiveResult` (ResultList.tsx) — wraps each result card and tracks user interaction (clicks and hover intent). This feeds click data into Coveo's ART model, which learns over time which results are useful for a given query.

`buildQuerySummary` (ResultList.tsx) — gives the "Results 1-10 of 152 for 'Pikachu' - 0.23s" line. Stays in sync with the actual search state automatically.

`buildFacet` (Facet.tsx) — generates checkbox filters from index values. Used twice: once for Pokemon Type, once for Generation. Coveo computes the values and counts from the current result set.

`buildStaticFilter` (SearchWidgets.tsx) — like a facet, but with values I define myself instead of pulling from the index. Used for Starter, Legendary, and Mythical filters, each with a hardcoded expression like `@pokemoncategory=="Legendary"`.

`buildSort` (ResultList.tsx) — manages the active sort criterion. Exposes the current sort so I can highlight the right option in the dropdown.

`buildPager` (SearchWidgets.tsx) — page navigation (previous/next, page numbers).

`buildResultsPerPage` (ResultList.tsx) — lets the user switch between 10, 25, or 50 results per page.

`buildGeneratedAnswer` (SearchWidgets.tsx) — Coveo's RGA (Relevance Generative Answering). When a user searches, Coveo selects passages from the results, sends them to its internal LLM, and streams back a grounded answer with citations. No custom prompt, no external API.

`buildDidYouMean` (SearchWidgets.tsx) — spelling correction. If Coveo detects a likely typo, it either auto-corrects or suggests the right query. "drgaon type" becomes "dragon type".

`buildRecentQueriesList` (SearchWidgets.tsx) — stores the last 5 searches client-side and shows them in the sidebar. Clicking one re-runs that query.

`buildNotifyTrigger` (SearchWidgets.tsx) — renders notifications configured in the Coveo query pipeline. If a pipeline trigger fires (e.g., when someone searches "Missingno"), this controller picks it up and displays the message.

`buildUrlManager` (SearchWidgets.tsx) — syncs the full search state (query, facets, sort, page) to the URL hash. Changing a facet updates the URL, pasting a URL restores the search. Makes any search shareable via link.

### Utility functions

These don't have state. They create configuration objects that get passed to controllers.

`buildStaticFilterValue` (SearchWidgets.tsx) — creates a single value object for `buildStaticFilter`. Each one holds a label and a filter expression.

`buildRelevanceSortCriterion` (ResultList.tsx) — creates the default relevance sort criterion.

`buildFieldSortCriterion` (ResultList.tsx) — creates a sort criterion for a specific field. I use it for `pokemonnumber` (ascending/descending) and `title` (A-Z).

`buildCriterionExpression` (ResultList.tsx) — converts a sort criterion object to a string so I can compare it with the currently active sort and highlight the right option in the UI.

### Action loaders

These are not controllers. They load action creators from the engine so I can dispatch specific events.

`loadSearchActions` (page.tsx) — gives me the `executeSearch` action. I dispatch it on page load to trigger the initial search.

`loadSearchAnalyticsActions` (page.tsx) — gives me the `logInterfaceLoad` action. I pass it to `executeSearch` so Coveo logs that a new session started, which feeds into analytics and ML training.

### Outside Headless

The Passage Retrieval API (`/rest/search/v3/passages/retrieve`) has no Headless controller, so I call the REST endpoint directly (in `lib/passage-retrieval.ts`). It returns specific text chunks from documents instead of full results. I use it in two places: to feed context into the RAG chat, and on detail pages to show relevant passages about each Pokemon.

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
