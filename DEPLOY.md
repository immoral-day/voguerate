# Production Deploy

## Quick Deploy Without Domain

Set `APP_URL` and `FRONTEND_URL` to the server IP:

```env
APP_URL=http://YOUR_SERVER_IP
FRONTEND_URL=http://YOUR_SERVER_IP
```

Start the app:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend php artisan migrate --force
docker compose -f docker-compose.prod.yml exec backend php artisan optimize
```

Open:

```text
http://YOUR_SERVER_IP
```

When a domain is ready, change `APP_URL` and `FRONTEND_URL` to `https://domain.ru`, restart containers, and add SSL.

## Server

Use a VPS with Docker and Docker Compose. Copy the project to the server, then create:

```bash
cp backend/laravel/.env.production.example backend/laravel/.env.production
docker compose -f docker-compose.prod.yml run --rm backend php artisan key:generate --show
```

Put the generated key into `APP_KEY` in `backend/laravel/.env.production`, set `APP_URL` and `FRONTEND_URL` to your real domain.

## Start

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend php artisan migrate --force
docker compose -f docker-compose.prod.yml exec backend php artisan optimize
```

The app is served on port `80`. Put your domain and SSL proxy in front of it, or attach Cloudflare.

## Updates

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend php artisan migrate --force
docker compose -f docker-compose.prod.yml exec backend php artisan optimize
```
