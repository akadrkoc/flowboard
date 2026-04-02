# FlowBoard

Collaborative Kanban task management application.

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Drag & Drop:** @dnd-kit/core + @dnd-kit/sortable
- **State:** Zustand
- **API:** Apollo Server (GraphQL) + graphqlFetch (lightweight client)
- **Database:** MongoDB Atlas + Mongoose
- **Real-time:** Socket.io (custom server)
- **Auth:** NextAuth.js v4 (Google + GitHub OAuth, JWT session)
- **Charts:** Recharts

## Project Structure

```
server.ts                 # Custom HTTP server (Next.js + Socket.io)
tsconfig.server.json      # TypeScript config for server.ts
src/
  app/
    page.tsx              # Ana sayfa - Board render + init
    login/page.tsx        # Login sayfasi (GitHub + Google OAuth)
    layout.tsx            # Root layout (SessionWrapper, font)
    globals.css           # Global stiller
    api/
      graphql/route.ts    # Apollo Server GraphQL endpoint (auth context)
      auth/[...nextauth]/ # NextAuth.js API route
      test-db/route.ts    # MongoDB baglanti testi
  components/
    Board.tsx             # DndContext + kolon layout
    KanbanColumn.tsx      # Tekil kolon (SortableContext)
    KanbanCard.tsx        # Tekil kart (useSortable)
    AddCardForm.tsx       # Yeni kart ekleme dialog
    Navbar.tsx            # Ust navigasyon (user avatar, logout)
    StatsBar.tsx          # Alt istatistik bari
    SessionWrapper.tsx    # NextAuth SessionProvider wrapper
    analytics/
      AnalyticsDashboard.tsx  # Ana analytics sayfasi
      CompletedPerDay.tsx     # Bar chart
      CardsByMember.tsx       # Pie chart
      SprintBurndown.tsx      # Line chart
      StatCards.tsx            # Stat kartlari
    ui/                   # shadcn/ui primitives
  graphql/
    typeDefs.ts           # GraphQL schema
    resolvers.ts          # GraphQL resolvers (auth context destekli)
    operations.ts         # Client-side query/mutation strings
  lib/
    mongodb.ts            # Mongoose connection helper (cached)
    graphqlFetch.ts       # Lightweight GraphQL client (fetch-based)
    socket.ts             # Socket.io client singleton
    auth.ts               # NextAuth config (providers, callbacks)
  models/
    Board.ts              # Mongoose Board model
    Column.ts             # Mongoose Column model
    Card.ts               # Mongoose Card model
    User.ts               # Mongoose User model
  store/
    boardStore.ts         # Zustand store (API + Socket.io entegreli)
  types/
    board.ts              # Card, Column, Priority tipleri
  middleware.ts           # NextAuth middleware (route korumasi)
  data/
    mockData.ts           # Ornek veriler (Phase 1 legacy)
```

## Commands

```bash
npm run dev      # Custom server (Next.js + Socket.io, localhost:3000)
npm run dev:next # Sadece Next.js dev server (Socket.io yok)
npm run build    # Production build
npm run lint     # ESLint
```

## Environment Variables

```
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Development Phases

### PHASE 1 - Project Setup & Kanban Board UI [TAMAMLANDI]

- [x] Next.js 14 + TypeScript + Tailwind kurulumu
- [x] shadcn/ui kurulumu ve konfigurasyonu
- [x] @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities kurulumu
- [x] Zustand kurulumu
- [x] Card & Column TypeScript tipleri
- [x] Zustand store (moveCard, addCard, updateCard, deleteCard, toggleDarkMode)
- [x] 4 kolon: Backlog, In Progress, Review, Done
- [x] Kolon header: baslik + kart sayisi badge
- [x] Kart icerik: title, label badges, priority dot, due date, story points, assignee avatar
- [x] Kolonlar arasi drag-and-drop (DndContext + SortableContext)
- [x] Ayni kolon icinde siralama (reorder)
- [x] Drag animasyonu (150ms ease, DragOverlay)
- [x] "Add card" butonu - dialog ile inline form
- [x] Dark mode (varsayilan acik, toggle mevcut)
- [x] Navbar: logo, sprint badge, online avatarlar, view switcher
- [x] StatsBar: toplam kart, done, story points, progress bar, online indicator
- [x] Mock data ile tam calisan board
- [x] Responsive: yatay scroll (mobil), navbar collapse
- [x] UI primitives: Avatar, Badge, Dialog, Input, Select, Switch, Textarea, Tooltip

---

### PHASE 2 - GraphQL API + Real-time [TAMAMLANDI]

- [x] MongoDB Atlas baglantisi (Mongoose + connection helper)
- [x] Mongoose modelleri: Board, Column, Card, User
- [x] Apollo Server kurulumu (`/api/graphql` route)
- [x] GraphQL type definitions + resolvers
- [x] Frontend GraphQL client (graphqlFetch - fetch-based)
- [x] Zustand store API entegrasyonu
- [x] Optimistic UI: kart aninda hareket, arka planda mutation
- [x] Custom server (server.ts - Next.js + Socket.io tek port)
- [x] Socket.io server (board rooms, event broadcasting)
- [x] Socket.io client entegrasyonu (auto-join, event listeners)
- [x] Real-time sync: card-moved, card-created, card-updated, card-deleted
- [x] Board otomatik olusturma (ilk acilista board yoksa olustur)

---

### PHASE 3 - Authentication (NextAuth.js) [TAMAMLANDI]

- [x] NextAuth.js v4 kurulumu (JWT session strategy)
- [x] GitHub OAuth provider
- [x] Google OAuth provider
- [x] Kullanici otomatik olusturma (signIn callback ile MongoDB'ye kayit)
- [x] Middleware ile route korumasi (auth olmadan /login'e redirect)
- [x] /login sayfasi (dark theme, GitHub + Google butonlari)
- [x] SessionProvider wrapper (layout.tsx)
- [x] Navbar: kullanici avatari, isim, logout butonu
- [x] GraphQL context'e userId ekleme
- [x] createBoard'da gercek ownerId
- [x] boards query'de kullaniciya ozel filtreleme

---

### PHASE 4 - Analytics Sayfasi [TAMAMLANDI]

Navbar'daki "Analytics" butonuyla acilir (activeView state).

- [x] Recharts kurulumu
- [x] Bar chart: son 14 gunde tamamlanan kartlar (CompletedPerDay)
- [x] Pie chart: takim uyesine gore kart dagilimi (CardsByMember)
- [x] Line chart: sprint burndown - ideal vs remaining (SprintBurndown)
- [x] Stat kartlari: avg cycle time, velocity, on-time rate, completed (StatCards)
- [x] Analytics view switcher entegrasyonu (Navbar buton → activeView → AnalyticsDashboard)
- [x] Responsive layout (2x2 grid desktop, tek kolon mobile)

---

## Conventions

- Component dosyalari PascalCase: `KanbanCard.tsx`
- Store dosyalari camelCase: `boardStore.ts`
- Type dosyalari camelCase: `board.ts`
- shadcn/ui bilesenleri `src/components/ui/` altinda
- Tum bilesenler `"use client"` directive kullanir (client-side interactivity)
- Tailwind dark mode: class-based (`dark:` prefix)
- Import alias: `@/` -> `src/`
- GraphQL: Apollo Server (backend), graphqlFetch (frontend - lightweight)
- Real-time: Socket.io event-based (join-board, card-moved, card-created, card-updated, card-deleted)
- Auth: NextAuth.js v4, JWT session, middleware route korumasi
