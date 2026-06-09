# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Voguerate** — a techwear/fashion community platform. Users rate clothing items, track upcoming drops, read articles, and earn reputation. Stack: React 19 + TypeScript frontend, Laravel 12 PHP backend, Docker Compose orchestration.

## Running the Project

```bash
# Start everything (frontend on :3000, backend on :8080)
docker compose up --build

# Frontend only (dev server with hot reload)
cd frontend && npm install --legacy-peer-deps && npm run dev

# Backend only
cd backend/laravel && composer install && php artisan migrate && php artisan serve
```

Frontend env: `VITE_API_URL=http://localhost:8080/api` (set via docker-compose or `.env.local`).

Backend env: copy `backend/laravel/.env.example` → `.env`, then `php artisan key:generate`.

## Key Commands

```bash
# Frontend
npm run dev        # Vite dev server (port 3000)
npm run build      # Production build
npm run preview    # Preview build

# Backend (from backend/laravel/)
php artisan migrate         # Run migrations
php artisan migrate:fresh   # Drop & re-run all migrations
php artisan queue:work      # Process queued jobs
php artisan test            # Run PHPUnit tests
composer test               # Same via composer script
```

## Architecture

### Frontend (`frontend/src/`)

**No router library.** All navigation is manual via `viewState` in `App.tsx`. The `navigateTo(view, params?)` function updates `viewState`, which switches between 16 view components. All global state (users, items, reviews, drops, articles) lives in `App.tsx` and flows down via props.

- `App.tsx` — root: all state, all data-fetching handlers, view switcher
- `services/apiService.ts` — fetch wrapper with `get/post/put/delete/uploadFile`; reads `VITE_API_URL`
- `types.ts` — all TypeScript interfaces (`User`, `ClothingItem`, `Review`, `UpcomingDrop`, `Article`, `ViewState`, etc.)
- `components/UI.tsx` — shared primitives: `Button`, `TextInput`, `Avatar`, `Rating`, `Badge`, `ToastContainer`
- `components/RichTextEditor.tsx` — TipTap WYSIWYG used in admin article editor
- `views/` — one file per page (13 views)
- `components/layout/` — `NavBar`, `Header`, `Sidebar`, `Footer`, `SearchResultsOverlay`

**Tailwind theme** (techwear aesthetic):
- `bg`: `#F2EFE8` (beige), `ink`: `#0D0D0D`, `accent`: `#E8FF00` (neon yellow), `muted`: `#9A9690`
- Fonts: DM Sans (body), Space Mono (mono), Bebas Neue (display)

### Backend (`backend/laravel/`)

Laravel 12, stateless JSON API. All routes in `routes/api.php` under `/api/v1/` prefix. No auth middleware currently — authorization is frontend-enforced by `currentUser.role`.

**Controllers** (`app/Http/Controllers/Api/`):
- `AuthController` — login, forgot/reset password
- `UserController` — CRUD + follow, ban, verify badge, change password
- `ItemController`, `ReviewController`, `DropController`, `ArticleController` — standard CRUD
- `UploadController` — file upload to `storage/app/public/{type}/`
- `ModerationController` — reported reviews & users
- `AuthorshipController` — designer verification requests

**User roles**: `USER`, `DESIGNER`, `ADMIN`. First registered user auto-gets `ADMIN`.

**File uploads**: Stored under `storage/app/public/` with subdirs `avatars/`, `profiles/`, `items/`, `drops/`. Public symlink at `public/storage`.

**Database**: SQLite by default (dev). File: `database/database.sqlite`. Switch to MySQL via `DB_CONNECTION` in `.env`.

## Project Conventions

- **Language**: All comments, variables, UI text, and commit messages in **Russian**.
- **Pattern**: Early Return — validate/guard at the top of functions, happy path at the bottom.
- **No hardcoded values** — use `.env` / constants files.
- **API calls**: Always wrap in `try/catch`; `apiService` parses Laravel 422 validation errors automatically.
- **Laravel**: Use FormRequests for validation, API Resources for response shaping, eager load Eloquent relations.
- **React**: Functional components only, hooks, destructure props.
