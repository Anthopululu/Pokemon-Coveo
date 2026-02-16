# Pokemon Coveo Challenge — Code Architecture

> A Next.js Pokedex app powered by Coveo search, with LinkedIn profile importing via Bright Data.

---

## Project Structure (12 files)

```
src/
├── app/                              # Next.js App Router (pages + API)
│   ├── layout.tsx                    #   Root layout (fonts, metadata)
│   ├── page.tsx                      #   Homepage (search UI)
│   ├── globals.css                   #   Styles + design system
│   ├── icon.svg                      #   Favicon
│   ├── pokemon/[name]/page.tsx       #   Pokemon detail page
│   └── api/
│       ├── chat/route.ts             #   AI chat endpoint (Groq/Llama)
│       └── linkedin/add/route.ts     #   LinkedIn import + delete
│
├── components/                       # React UI components
│   ├── SearchWidgets.tsx             #   ALL search widgets (SearchBox, Facet, Pager, GenAI, etc.)
│   ├── ResultList.tsx                #   Pokemon cards grid + pending/deleted logic
│   ├── AddLinkedIn.tsx               #   "Catch Pokemon" import button
│   └── AIChatPopup.tsx               #   Floating AI chat widget
│
└── lib/
    └── coveo.ts                      #   Coveo engine + passage retrieval + type colors
```

---

## How It All Connects

```
                    ┌──────────────────────────────────┐
                    │         page.tsx (Homepage)        │
                    │   Initializes Coveo search engine  │
                    └──────────┬────────────────────────┘
                               │ renders
          ┌────────────────────┼─────────────────────────┐
          │                    │                          │
    ┌─────▼──────┐    ┌───────▼────────┐    ┌────────────▼────────────┐
    │SearchWidgets│    │  ResultList    │    │     AddLinkedIn         │
    │ SearchBox   │    │ (Pokemon cards)│    │  (LinkedIn import)      │
    │ Facet       │    └───────┬────────┘    └────────────┬────────────┘
    │ Pager       │            │                          │
    │ GenAI       │            │                          │ POST /api/linkedin/add
    │ etc.        │    Coveo Engine (shared)               ▼
    └─────┬───────┘     from lib/coveo.ts      ┌─────────────────────┐
          │                    ▲                │ route.ts (API)      │
          └────────────────────┘                │ Bright Data scrape  │
                                                │ → Coveo Push API    │
                                                └─────────────────────┘
    ┌──────────────────────┐
    │   AIChatPopup        │
    │ Coveo search + Groq  │──── POST /api/chat ──→ Groq (Llama 3.3 70B)
    └──────────────────────┘
```

---

## The 3 Core Flows

### 1. Search Flow

```
User types query → SearchBox → Coveo Engine → ResultList renders cards
                                    ↕
                              Facet filters
```

1. `page.tsx` creates a **Coveo search engine** singleton (`lib/coveo.ts`)
2. `SearchBox` (in SearchWidgets.tsx) sends queries to the engine
3. `ResultList` subscribes to the engine and renders Pokemon cards
4. `Facet` (in SearchWidgets.tsx) lets users filter by Type, Generation
5. Clicking a card → `/pokemon/[name]` detail page

### 2. LinkedIn Import Flow

```
User pastes URL → AddLinkedIn → /api/linkedin/add → Bright Data → Coveo
                       ↓
                  localStorage (instant display)
                       ↓
                  ResultList shows "Just added" card
```

1. User pastes a LinkedIn URL in `AddLinkedIn`
2. Frontend POSTs to `/api/linkedin/add`
3. Server scrapes the profile via **Bright Data API**
4. Profile is mapped to Pokemon format (name→title, company→type, role→species)
5. Document is pushed to **Coveo Push API**
6. Response saved in **localStorage** → instant display before Coveo indexes (~15s)

### 3. AI Chat Flow

```
User question → AIChatPopup → Coveo search (context)
                             → Passage retrieval (context)
                             → /api/chat → Groq API → streamed response
```

1. `AIChatPopup` creates a separate Coveo engine per question
2. Gets top 4 results + passages as context
3. Sends to `/api/chat` → Groq (Llama 3.3 70B) with streaming
4. Response streams back token-by-token

---

## File-by-File Guide

### Pages

| File | URL | Role |
|------|-----|------|
| `layout.tsx` | — | Root layout. Loads fonts (Syne, Outfit, JetBrains Mono). |
| `page.tsx` | `/` | Homepage. Initializes Coveo, renders all search components. |
| `pokemon/[name]/page.tsx` | `/pokemon/pikachu` | Detail page. Shows image, types, stats, passages. |

### API Routes

| File | Endpoint | Role |
|------|----------|------|
| `api/chat/route.ts` | `POST /api/chat` | Sends query + context to Groq, streams response. |
| `api/linkedin/add/route.ts` | `POST` | Scrapes LinkedIn via Bright Data, pushes to Coveo. |
| | `DELETE` | Removes a document from Coveo index. |

### Components

| File | Exports | Role |
|------|---------|------|
| `SearchWidgets.tsx` | `SearchBox`, `Facet`, `MobileFacets`, `Pager`, `GenAIAnswer`, `DidYouMean`, `NotifyTrigger`, `RecentQueries`, `StaticFilter`, `SearchUrlManager`, `PassageHighlights` | All Coveo search UI widgets in one file. |
| `ResultList.tsx` | `ResultList` | Pokemon cards grid. Handles pending profiles (localStorage) and deleted profiles. |
| `AddLinkedIn.tsx` | `AddLinkedIn` | "Catch Pokemon" button. Pokeball animation. Saves to localStorage on success. |
| `AIChatPopup.tsx` | `AIChatPopup` | Floating AI chat. Searches Coveo for context, streams Groq responses. |

### Library

| File | Exports | Role |
|------|---------|------|
| `coveo.ts` | `coveoConfig`, `getSearchEngine`, `useCoveoController`, `retrievePassages`, `Passage`, `typeColors`, `typeHex`, `typeBgGradients`, `typeHeroGradients` | Everything shared: Coveo config, engine singleton, React hook, passage retrieval API, Pokemon type color maps. |

---

## Key Technologies

| Tech | Role | Where |
|------|------|-------|
| **Next.js 14** | Framework + routing + API routes | Everything |
| **Coveo Headless** | Search engine controllers (client) | `coveo.ts`, `SearchWidgets`, `ResultList` |
| **Coveo Push API** | Index/delete documents (server) | `api/linkedin/add` |
| **Bright Data** | LinkedIn profile scraping | `api/linkedin/add` |
| **Groq** (Llama 3.3 70B) | AI chat | `api/chat` |
| **localStorage** | Instant pending/deleted state | `ResultList`, `AddLinkedIn`, `SearchBox` |

---

## localStorage Keys

| Key | Format | Purpose | TTL |
|-----|--------|---------|-----|
| `pokedex-pending-linkedin` | `[{documentId, title, ...}]` | Show profiles before Coveo indexes them | 2 min |
| `pokedex-deleted-linkedin` | `[{id, title, at}]` | Hide deleted profiles before Coveo syncs | 2 min |

---

## Environment Variables

```env
NEXT_PUBLIC_COVEO_ORG_ID=...       # Coveo org (client-side)
NEXT_PUBLIC_COVEO_SEARCH_TOKEN=... # Coveo search token (client-side)
COVEO_ORG_ID=...                   # Coveo org (server-side)
COVEO_API_KEY=...                  # Coveo Push API key (server-side)
COVEO_SOURCE_ID=...                # Coveo source ID (server-side)
BRIGHT_DATA_API_TOKEN=...         # Bright Data scraping API
GROQ_API_KEY=...                   # Groq API key
```
