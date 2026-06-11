#!/bin/sh

set -eu

PUBLIC_STORAGE=/app/storage/app/public
DEFAULT_STORAGE=/app/storage-defaults
DATABASE_PATH=${DB_DATABASE:-/app/database/database.sqlite}
DATABASE_DIR=$(dirname "$DATABASE_PATH")

mkdir -p \
    "$DATABASE_DIR" \
    "$PUBLIC_STORAGE/avatars" \
    "$PUBLIC_STORAGE/profiles" \
    "$PUBLIC_STORAGE/items" \
    "$PUBLIC_STORAGE/drops" \
    "$PUBLIC_STORAGE/articles"

touch "$DATABASE_PATH"

if [ -d "$DEFAULT_STORAGE" ]; then
    find "$DEFAULT_STORAGE" -type f | while IFS= read -r source; do
        relative_path="${source#${DEFAULT_STORAGE}/}"
        target="$PUBLIC_STORAGE/$relative_path"

        if [ ! -e "$target" ]; then
            mkdir -p "$(dirname "$target")"
            cp "$source" "$target"
        fi
    done
fi

chown -R www-data:www-data /app/storage /app/bootstrap/cache
chown www-data:www-data "$DATABASE_DIR" "$DATABASE_PATH"
chmod -R 775 /app/storage /app/bootstrap/cache
chmod 775 "$DATABASE_DIR"
chmod 664 "$DATABASE_PATH"

ln -sf /app/storage/app/public /app/public/storage

php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec /usr/bin/supervisord -c /etc/supervisord.conf
