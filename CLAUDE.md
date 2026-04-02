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
- **Auth:** NextAuth.js (Google + GitHub OAuth) — Phase 3
- **Charts:** Recharts — Phase 4

## Project Structure

```
server.ts                 # Custom HTTP server (Next.js + Socket.io)
tsconfig.server.json      # TypeScript config for server.ts
src/
  app/
    page.tsx              # Ana sayfa - Board render + init
    layout.tsx            # Root layout (dark mode, font)
    globals.css           # Global stiller
    api/
      graphql/route.ts    # Apollo Server GraphQL endpoint
      test-db/route.ts    # MongoDB baglanti testi
  components/
    Board.tsx             # DndContext + kolon layout
    KanbanColumn.tsx      # Tekil kolon (SortableContext)
    KanbanCard.tsx        # Tekil kart (useSortable)
    AddCardForm.tsx       # Yeni kart ekleme dialog
    Navbar.tsx            # Ust navigasyon
    StatsBar.tsx          # Alt istatistik bari
    ui/                   # shadcn/ui primitives
  graphql/
    typeDefs.ts           # GraphQL schema
    resolvers.ts          # GraphQL resolvers
    operations.ts         # Client-side query/mutation strings (Apollo)
  lib/
    mongodb.ts            # Mongoose connection helper (cached)
    graphqlFetch.ts       # Lightweight GraphQL client (fetch-based)
    socket.ts             # Socket.io client singleton
  models/
    Board.ts              # Mongoose Board model
    Column.ts             # Mongoose Column model
    Card.ts               # Mongoose Card model
    User.ts               # Mongoose User model
  store/
    boardStore.ts         # Zustand store (API + Socket.io entegreli)
  types/
    board.ts              # Card, Column, Priority tipleri
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
MONGODB_URI=mongodb+srv://...   # .env.local dosyasinda
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

### PHASE 3 - Authentication (NextAuth.js) [SIRADA]

- [ ] NextAuth.js kurulumu
- [ ] Google OAuth provider konfigurasyonu
- [ ] GitHub OAuth provider konfigurasyonu
- [ ] MongoDB session storage (MongoDBAdapter)
- [ ] Board route'larini koruma: auth olmadan /login'e redirect
- [ ] /login sayfasi tasarimi
- [ ] Navbar'da giris yapmis kullanicinin avatarini goster
- [ ] Board uyelik sistemi (owner, member rolleri)
- [ ] API route'larinda auth kontrolu (GraphQL context)

---

### PHASE 4 - Analytics Sayfasi [BEKLEMEDE]

Route: `/board/[id]/analytics`

Recharts ile:
- [ ] Bar chart: son 14 gunde tamamlanan kartlar (gune gore)
- [ ] Pie chart: takim uyesine gore kart dagilimi
- [ ] Line chart: sprint burndown (gun basina kalan story points)
- [ ] Stat kartlari: ortalama cycle time, velocity (pts/sprint), on-time rate
- [ ] Analytics view switcher ile entegrasyon (Navbar'daki buton)
- [ ] Tarih aralik secici (date range picker)
- [ ] Responsive layout (mobile-friendly grid)

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
