# Легкий запуск без полного Docker

Обычный `docker compose up --build` теперь поднимает только backend. Для разработки легче держать в Docker только Laravel, а Vite запускать на хосте.

## Быстрый вариант

```powershell
.\scripts\dev-lite.ps1
```

Что делает скрипт:
- поднимает только backend из `docker-compose.light.yml`;
- создает `frontend/.env.local` с `VITE_API_URL=/api`, если файла нет;
- запускает frontend через `npm run dev:local` на `http://127.0.0.1:5173`.

## Вручную

```powershell
docker compose up -d backend
cd frontend
npm run dev:local
```

Backend API: `http://localhost:8080/api`

Frontend: `http://127.0.0.1:5173`

Фронт ходит на относительный `/api`, а Vite проксирует `/api` и `/storage` в Laravel. Поэтому для локальной разработки и ngrok не нужно вручную менять API URL.

## Ngrok для показа проекта

Ngrok можно использовать только как временный туннель:

```powershell
ngrok http 5173
```

Открывать нужно ngrok-адрес фронта. Запускать отдельный туннель для backend не нужно, потому что Vite проксирует API и картинки.

## Старый полный Docker-режим

```powershell
docker compose --profile full up --build
```

Этот режим снова поднимет frontend в контейнере, поэтому он тяжелее.

## Полностью без Docker

Для этого нужен локальный PHP 8.4 с `pdo_sqlite`, `sqlite3`, `fileinfo`, `mbstring`, `openssl` и Composer. Сейчас проектный `vendor` собран под PHP 8.4, поэтому PHP 8.3 не запустит Laravel без переустановки зависимостей.
