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

## Coveo Headless controllers and functions

Everything I imported from `@coveo/headless`, grouped by what they do in the app.

### Search engine

`buildSearchEngine` creates the engine instance that every other controller connects to. I have three of them: the main one for the search page, one dedicated to the detail page (so opening a Pokemon doesn't mess with the main search state), and one for the chat popup (same reason). One engine = one independent search context.

### Search input

`buildSearchBox` handles the text input, debounced queries, and would normally handle query suggestions too. The native suggestion system relies on a Query Suggest ML model, which needs real user traffic to train. Mine is empty, so I set `numberOfSuggestions: 0` and built a custom autocomplete on top that queries the Coveo Search API directly and returns matching Pokemon titles. The Headless controller still manages the query text and triggers searches.

### Results

`buildResultList` fetches and displays search results. I pass a list of custom fields to include (`pokemontype`, `pokemonnumber`, `pokemonimage`, etc.) so each Pokemon card has all the data it needs without extra API calls. Used on the search page, on the detail page (to fetch a single Pokemon by name), and in the chat popup (to get context for the RAG pipeline).

`buildInteractiveResult` wraps each Pokemon card. It tracks clicks and hover intent (if you hover for more than a second, it counts as interest). This data feeds into Coveo's ART (Automatic Relevance Tuning) model, which learns over time which results users actually find useful for a given query. Without it, Coveo has no click signal to learn from.

`buildQuerySummary` gives the "Results 1-10 of 152 for 'Pikachu' - 0.23s" line. Saves me from formatting that string manually and keeps it in sync with the actual search state.

### Filtering

`buildFacet` generates checkbox filters from index field values. I use it twice: once for Pokemon Type, once for Generation. Coveo computes the facet values and counts automatically from the search results.

`buildStaticFilter` and `buildStaticFilterValue` are for filters where I define the values myself instead of pulling them from the index. I use them for Starter, Legendary, and Mythical Pokemon. Each value has a hardcoded filter expression (like `@pokemoncategory=="Legendary"`) that I wrote. The difference with facets is that these don't depend on what's in the current result set.

### Sorting and pagination

`buildSort` manages the sort dropdown. `buildRelevanceSortCriterion` gives the default relevance sort. `buildFieldSortCriterion` lets me sort by a specific field (I use it for Pokedex number ascending/descending and name A-Z). `buildCriterionExpression` converts a sort criterion object to a string so I can compare it with the currently active sort and highlight the right option in the UI.

`buildPager` handles page navigation at the bottom (previous/next, page numbers). `buildResultsPerPage` lets the user switch between 10, 25, or 50 results per page.

### AI and corrections

`buildGeneratedAnswer` is Coveo's RGA (Relevance Generative Answering). When a user searches, Coveo picks the most relevant passages from the results, sends them to its internal LLM, and streams back a grounded answer with citations. It shows up at the top of the results. No custom prompt, no external API, Coveo handles the full pipeline.

`buildDidYouMean` handles spelling correction. If Coveo detects a likely typo and gets poor results, it either auto-corrects or suggests the right query. Typing "drgaon type" gets corrected to "dragon type".

### UX and state

`buildRecentQueriesList` keeps the last 5 searches in the sidebar. Clicking one re-runs that query. Stored client-side, resets on page refresh.

`buildNotifyTrigger` renders notifications configured in the query pipeline. If I set up a trigger in the Coveo admin (for example, show a message when someone searches "Missingno"), this controller picks it up and renders it.

`buildUrlManager` syncs the full search state (query, facets, sort, page) to the URL hash. Changing a facet updates the URL, and pasting a URL restores the full search state. Makes searches shareable.

`loadSearchActions` and `loadSearchAnalyticsActions` are not controllers but action loaders. I use them on page load to dispatch the initial search and log an `interfaceLoad` analytics event so Coveo knows a session started.

### Outside Headless

The Passage Retrieval API (`/rest/search/v3/passages/retrieve`) has no Headless controller, so I call the REST endpoint directly. It returns specific text chunks from documents instead of full results. I use it in two places: to feed context into the RAG chat, and on detail pages to show relevant passages about each Pokemon.

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
