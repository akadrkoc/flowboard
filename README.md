# FlowBoard

Collaborative Kanban board for managing tasks across teams. Built with Next.js, GraphQL, and real-time synchronization.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

## What is FlowBoard?

FlowBoard is a task management tool where teams can organize work visually using a Kanban board. Cards move through columns (To Do, In Progress, Review, Done), and changes sync instantly across all connected users via WebSockets.

### Key Features

- **Drag-and-drop Kanban board** with customizable columns
- **Real-time collaboration** -- see changes from teammates instantly
- **Sprint management** -- create sprints, track burndown
- **Analytics dashboard** -- completed tasks per day, team workload distribution, velocity tracking
- **Authentication** with GitHub and Google OAuth
- **Board-level access control** -- only members can view and modify board data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| API | Apollo Server (GraphQL) |
| Database | MongoDB Atlas (Mongoose) |
| Real-time | Socket.io |
| Auth | NextAuth.js v4 (JWT) |
| State | Zustand |
| Drag & Drop | dnd-kit |
| Charts | Recharts |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster
- GitHub and/or Google OAuth app credentials

### Setup

1. Clone the repo:

```bash
git clone https://github.com/akadrkoc/flowboard.git
cd flowboard
npm install
```

2. Create a `.env.local` file:

```
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

3. Start the development server:

```bash
npm run dev
```

This starts both Next.js and the Socket.io server on port 3000.

### Other Commands

```bash
npm run dev:next   # Next.js only (no WebSocket support)
npm run build      # Production build
npm run lint       # Run ESLint
```

## Project Structure

```
server.ts                    # Custom HTTP server (Next.js + Socket.io)
src/
  app/                       # Next.js App Router pages and API routes
    api/graphql/route.ts     # GraphQL endpoint
    api/auth/[...nextauth]/  # OAuth handlers
  components/                # React components
    Board.tsx                # Main board with drag-and-drop context
    KanbanColumn.tsx         # Single column
    KanbanCard.tsx           # Single card
    analytics/               # Charts and stats
  graphql/
    typeDefs.ts              # GraphQL schema
    resolvers.ts             # Query and mutation resolvers
    auth.ts                  # Auth helpers and input validation
  models/                    # Mongoose schemas (Board, Column, Card, User, Sprint, Comment)
  store/
    boardStore.ts            # Zustand store with optimistic updates
  lib/
    socket.ts                # Socket.io client
    graphqlFetch.ts          # Lightweight GraphQL client
    auth.ts                  # NextAuth configuration
```

## Security

All GraphQL queries and mutations require authentication. Board data is scoped to members only -- users can only access boards they own or have been invited to. Input validation is enforced on all user-submitted data. Socket.io connections are authenticated via JWT and board membership is verified before joining rooms.

## License

MIT
