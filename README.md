# Pokedex Search

A Pokemon search app I built for the Coveo Pre-Sales Challenge. I indexed all 1025 Pokemon from pokemondb.net into Coveo Cloud and built a custom search experience using Coveo Headless.

I went with Headless over Atomic because I wanted full control over the UI. The idea was to make it feel like an actual Pokedex, not just a generic search page.

## What it does

- Full-text search across 1025 Pokemon with Coveo ranking
- Facets for Type and Generation
- Pokemon cards with official artwork and type-colored accents
- Floating AI chat popup with RAG (Coveo search + Groq Llama 3.3 70B for answer generation)
- Passage Retrieval API feeding context into the chat and on detail pages
- Query suggestions / type-ahead
- Detail pages with base stats, abilities, height/weight
- Responsive layout (mobile + desktop)

## Coveo Headless components used

The app uses 15 Coveo Headless controllers. Here's what each one does and why I picked it.

**Search engine and core search**

- `buildSearchEngine` — The engine itself. Every controller plugs into it and shares the same search state. One engine, one source of truth.
- `buildSearchBox` — Handles the search input, debounced queries, and query suggestions. Configured with 8 suggestions and highlight matching. This is what triggers every search.
- `buildResultList` — Fetches and displays the results. I specify which custom fields to include (`pokemontype`, `pokemonnumber`, etc.) so the cards have all the data they need without extra calls.
- `buildQuerySummary` — Gives a clean summary line: "Results 1-10 of 152 for Pikachu - 0.23s". Replaces the manual string formatting I had before.

**Filtering and navigation**

- `buildFacet` — Used twice: one for Pokemon Type, one for Generation. Standard checkbox facets in the sidebar.
- `buildTab` — Tabs across the top (All, Gen 1-5, Legendary). Each tab applies a constant filter expression like `@pokemongeneration==1`. Faster than clicking through facets for common filters.
- `buildStaticFilter` — Predefined filters in the sidebar (Starter, Legendary, Mythical). Unlike facets, these use hardcoded expressions that I wrote, not values from the index.
- `buildSort` — Dropdown to sort by relevance, Pokedex number (ascending/descending), or name A-Z. Defaults to relevance.

**Results and pagination**

- `buildPager` — Page navigation at the bottom. Previous/next buttons and page numbers.
- `buildResultsPerPage` — Lets the user choose 10, 25, or 50 results per page. Sits next to the sort dropdown.
- `buildInteractiveResult` — Wraps each Pokemon card. Tracks clicks and hover intent, which feeds data into the ART model. This is what teaches Coveo which results are actually useful for a given query.

**AI and corrections**

- `buildGeneratedAnswer` — The Coveo RGA component. Displays an AI-generated answer at the top of the results, with citations pointing to the source documents. No custom prompt, no external API — Coveo handles the LLM call internally.
- `buildDidYouMean` — Spelling correction. If Coveo thinks the query is misspelled and gets poor results, it suggests or auto-corrects. Works for things like "drgaon type" -> "dragon type".

**UX and state management**

- `buildRecentQueriesList` — Keeps the last 5 searches in the sidebar. Clicking one re-runs that search. Stored client-side, resets on page refresh.
- `buildNotifyTrigger` — Displays notifications configured in the query pipeline. If I set up a trigger in the Coveo admin (e.g., show a message when someone searches "Missingno"), this component renders it.
- `buildUrlManager` — Syncs search state with the URL hash. Selecting a facet or changing the query updates the URL, so searches can be shared via link.

## Coveo ML models

Four models are associated with the PokemonSearch pipeline:

- **Semantic Encoder** — Encodes queries and documents into vectors for semantic search. Makes "fire breathing lizard" return Charizard even though those exact words aren't in the document.
- **Relevance Generative Answering (RGA)** — Powers the AI Answer block via `buildGeneratedAnswer`. Coveo selects relevant passages, sends them to a GPT model, and streams a grounded answer back.
- **Query Suggestions** — Learns from search history to suggest queries as the user types. Needs usage data to train.
- **Automatic Relevance Tuning (ART)** — Learns from click data (via `buildInteractiveResult`) to re-rank results. The more users click on Pikachu when searching "electric mouse", the higher it climbs.

## Stack

- Next.js 14 (App Router), React 18, Tailwind CSS
- Coveo Headless for search state management
- Coveo Push API for indexing
- Coveo Passage Retrieval API for text chunk extraction
- Groq API (Llama 3.3 70B) for RAG answer generation in the chat

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

### Run

```bash
npm run dev
```

## How it works

On the frontend, each Coveo Headless controller is wired up through a `useCoveoController` hook that handles subscribe/unsubscribe. The detail page spins up its own engine instance to query one Pokemon without touching the main search state.

### AI chat

The floating chat (bottom-right) is a RAG pipeline:

1. Runs a Coveo search and Passage Retrieval in parallel to gather context
2. Sends the query + context + conversation history to Groq's Llama 3.3 70B via a Next.js API route (`/api/chat`)
3. Streams the response back token by token

The API route keeps the Groq key server-side. Streaming uses SSE, parsed client-side chunk by chunk. The chat remembers context across messages (up to 10 messages of history).

### Passage Retrieval

Instead of returning full documents, this API returns the specific text chunks that answer a query. Headless doesn't have a controller for it, so I called the REST endpoint directly (`/rest/search/v3/passages/retrieve`).

Used in two places:
1. As context for the RAG chat
2. On the detail page to surface relevant passages about each Pokemon

## What I learned about Coveo

### Push API vs Web Crawler

I went with the Push API. The Web Crawler would have been simpler to set up but I wanted control over what gets indexed and how the metadata is structured. Every Pokemon has properly typed fields (multi-value for types and abilities, integer for Pokedex number) instead of relying on Coveo to figure that out from raw HTML.

One thing that got me: the API key has to be generated from the Push source itself in the admin console. A manually created API key with the same permissions didn't work.

### Headless

Think of it like Redux but for search. Each controller has its own state and actions, and they all share the same engine. When you select a facet, the result list, query summary, and pager all update automatically. The `useCoveoController` hook avoids duplicating subscribe/unsubscribe across components.

### Query pipelines and ranking

The ML models are associated to a pipeline, and the frontend connects via `searchHub`. I also added a QRE (Query Ranking Expression) in the pipeline to boost well-known Pokemon (low Pokedex numbers) so that searching "pika" returns Pikachu before Pikipek. Without it, semantic search sometimes ranked less popular Pokemon higher because of closer embedding similarity.
