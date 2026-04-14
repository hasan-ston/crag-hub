# Crag Climbing — McMaster Climbing Gym Web App

## Overview

A mobile-first climbing session tracker for the McMaster University indoor climbing gym. Users log into walls, tap routes, and instantly record sends with near-zero friction. Built for speed and engagement — not training analytics.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS v4
- **Backend:** Supabase (Auth, Postgres, Storage)
- **Deployment:** Vercel (SPA with `vercel.json` rewrite)
- **Animation:** `motion` (framer-motion)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Router:** React Router v7

## Project Structure

```
src/
├── app/            # App root (App.tsx) and router (routes.tsx)
├── components/     # All UI screens and shared components
│   ├── admin-screen.tsx       # Wall/route management (upload photos, add routes)
│   ├── auth-gate.tsx          # Redirects unauthenticated users to login
│   ├── home-screen.tsx        # Wall grid + session stats
│   ├── image-fallback.tsx     # Graceful image loading with fallback
│   ├── login-screen.tsx       # Google OAuth + magic link email
│   ├── nav-bar.tsx            # Bottom navigation (Home, Stats, Profile)
│   ├── profile-screen.tsx     # User info, stats, admin link, sign out
│   ├── route-bottom-sheet.tsx # Flash/Send/Project logging per route
│   ├── stats-screen.tsx       # Weekly chart, grade distribution
│   └── wall-view.tsx          # Route overlays on wall image, filters
├── hooks/          # Data fetching and state management
│   ├── use-admin.ts           # CRUD for walls/routes + image upload
│   ├── use-auth.tsx           # Auth context (Google OAuth, magic link, profile)
│   ├── use-logs.ts            # Create/delete climb logs
│   ├── use-routes.ts          # Fetch routes enriched with user log status
│   ├── use-session-stats.ts   # Aggregate stats from logs
│   └── use-walls.ts           # Fetch walls with route counts
├── lib/            # Shared utilities
│   ├── constants.ts           # ROUTE_COLORS, GRADES arrays
│   ├── supabase.ts            # Supabase client singleton
│   ├── types.ts               # TypeScript interfaces (Wall, Route, Log, Profile)
│   └── utils.ts               # cn() utility for className merging
├── styles/         # Design system
│   ├── fonts.css              # Inter font import
│   ├── index.css              # Main CSS entry (imports theme + tailwind)
│   ├── tailwind.css           # Tailwind directives
│   └── theme.css              # CSS custom properties (dark theme tokens)
└── main.tsx        # Entry point
```

## Database Schema (Supabase)

**Project ID:** `ashyybexejlsvobysaxa`

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User display names + avatars (FK to auth.users) | Public read, owner write |
| `walls` | Climbing walls (id slug, name, image_url, display_order) | Public read |
| `routes` | Routes per wall (grade, color, region_x/y/w/h %, setter) | Public read |
| `logs` | User climb logs (flash/send/project per route) | Public read, owner insert/delete |

**Storage Bucket:** `wall-images` — public read, authenticated upload/delete.

### Key Relationships

- `profiles.id` → `auth.users.id`
- `routes.wall_id` → `walls.id`
- `logs.user_id` → `profiles.id`
- `logs.route_id` → `routes.id`
- `logs.log_type` CHECK constraint: `flash | send | project`

## Authentication

- **Google OAuth** — Primary sign-in method
- **Magic Link** — Email-based passwordless login via Gmail SMTP
- **SMTP:** `smtp.gmail.com:587` with app password, sender: `mhd.hasan236@gmail.com`
- Auth context in `use-auth.tsx` auto-creates a profile on first login

## Design System

- **Dark theme:** Background `#1a1a1f`, cards `#232329`, borders `#333340`
- **Accent:** Purple `#a855f7`
- **Font:** Inter (Google Fonts)
- **Mobile-first:** Fixed bottom nav, safe area insets, touch targets

## Routes (URL)

| Path | Component | Layout |
|------|-----------|--------|
| `/` | HomeScreen | NavBar |
| `/stats` | StatsScreen | NavBar |
| `/profile` | ProfileScreen | NavBar |
| `/wall/:wallId` | WallView | Standalone |
| `/admin` | AdminScreen | Standalone |

## Admin Panel

Accessible from **Profile → Admin Panel** (`/admin`). Features:
- **Add Wall:** Upload photo → Supabase Storage, set name + slug + display order
- **Manage Routes:** Grade picker, color picker, setter name, position preview overlay
- **Toggle Active:** Eye icon to activate/deactivate routes
- **Delete:** Remove walls (cascades routes) or individual routes

## Environment Variables

```
VITE_SUPABASE_URL=https://ashyybexejlsvobysaxa.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

## Development

```bash
npm install
npm run dev       # Starts Vite dev server on :5173
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

## Conventions

- No vibe-coded comments — keep code clean and intentional
- Hooks handle all Supabase queries; components are purely presentational
- Use `ImageFallback` component for all user-uploaded images
- Route regions are stored as percentages (0-100) for responsive overlay positioning
- All colors use hex values from theme.css or ROUTE_COLORS constant
