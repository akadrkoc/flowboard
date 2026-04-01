# FlowBoard

Collaborative Kanban task management application.

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Drag & Drop:** @dnd-kit/core + @dnd-kit/sortable
- **State:** Zustand
- **API:** Apollo Client (frontend) + Apollo Server (backend) - GraphQL
- **Database:** MongoDB + Mongoose
- **Real-time:** Socket.io
- **Auth:** NextAuth.js (Google + GitHub OAuth)
- **Charts:** Recharts

## Project Structure

```
src/
  app/
    page.tsx              # Ana sayfa - Board render
    layout.tsx            # Root layout (dark mode, font)
    globals.css           # Global stiller
  components/
    Board.tsx             # DndContext + kolon layout
    KanbanColumn.tsx      # Tekil kolon (SortableContext)
    KanbanCard.tsx        # Tekil kart (useSortable)
    AddCardForm.tsx       # Yeni kart ekleme dialog
    Navbar.tsx            # Ust navigasyon
    StatsBar.tsx          # Alt istatistik bari
    ui/                   # shadcn/ui primitives
  store/
    boardStore.ts         # Zustand global state
  types/
    board.ts              # Card, Column, Priority tipleri
  data/
    mockData.ts           # Ornek veriler (Phase 1)
```

## Data Shapes

```ts
type Card = {
  id: string;
  title: string;
  labels: string[];
  priority: "high" | "med" | "low";
  dueDate: string;
  storyPoints: number;
  assigneeInitials: string;
  assigneeColor: string;
  columnId: string;
  order: number;
};

type Column = {
  id: string;
  title: string;
  cards: Card[];
};
```

## Commands

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

---

## Development Phases

### PHASE 1 - Project Setup & Kanban Board UI 

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

**Eksikler / Phase 2'ye devredilen:**
- Optimistic UI server sync (backend yok henuz)
- Subscription-based real-time sync

---

### PHASE 2 - GraphQL API [SIRADA]

Apollo Server'i Next.js API route olarak kur (`/api/graphql`).

**Mongoose Modelleri:**
- `Board` { name, ownerId, memberIds[], columnIds[] }
- `Column` { name, boardId, order }
- `Card` { title, description, labels[], priority, dueDate, storyPoints, assigneeId, columnId, order }
- `User` { email, name, image, provider }

**GraphQL Schema:**
```graphql
type Query {
  boards: [Board!]!
  board(id: ID!): Board
  me: User
}

type Mutation {
  createBoard(name: String!): Board!
  createCard(columnId: ID!, input: CardInput!): Card!
  moveCard(cardId: ID!, toColumnId: ID!, newIndex: Int!): Card!
  updateCard(cardId: ID!, input: CardInput!): Card!
  deleteCard(cardId: ID!): Boolean!
  inviteMember(boardId: ID!, email: String!): Board!
}

type Subscription {
  onCardMoved(boardId: ID!): Card!
  onCardCreated(boardId: ID!): Card!
}
```

**Yapilacaklar:**
- [ ] MongoDB baglantisi (Mongoose + connection helper)
- [ ] Mongoose modelleri: Board, Column, Card, User
- [ ] Apollo Server kurulumu (`/api/graphql` route)
- [ ] GraphQL type definitions + resolvers
- [ ] Apollo Client kurulumu (frontend provider)
- [ ] Zustand store'u Apollo Client ile baglama
- [ ] Optimistic UI: kart aninda hareket, arka planda mutation
- [ ] Socket.io server kurulumu
- [ ] Socket.io client entegrasyonu
- [ ] Subscription: onCardMoved, onCardCreated ile real-time sync
- [ ] Hata yonetimi ve retry mekanizmasi

---

### PHASE 3 - Authentication (NextAuth.js) [BEKLEMEDE]

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
- shadcn/ui bileşenleri `src/components/ui/` altinda
- Tum bilesenler `"use client"` directive kullanir (client-side interactivity)
- Tailwind dark mode: class-based (`dark:` prefix)
- Import alias: `@/` -> `src/`
