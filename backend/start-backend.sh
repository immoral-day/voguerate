#!/bin/sh

set -eu

PUBLIC_STORAGE=/app/storage/app/public
DEFAULT_STORAGE=/app/storage-defaults

mkdir -p \
    "$PUBLIC_STORAGE/avatars" \
    "$PUBLIC_STORAGE/profiles" \
    "$PUBLIC_STORAGE/items" \
    "$PUBLIC_STORAGE/drops" \
    "$PUBLIC_STORAGE/articles"

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

chown -R www-data:www-data /app/storage /app/bootstrap/cache /app/database
chmod -R 775 /app/storage /app/bootstrap/cache
chmod 664 /app/database/database.sqlite

ln -sf /app/storage/app/public /app/public/storage

php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec /usr/bin/supervisord -c /etc/supervisord.conf
