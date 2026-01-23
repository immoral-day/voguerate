FROM php:8.4-fpm-alpine

WORKDIR /app

RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    git \
    unzip \
    libzip-dev \
    sqlite-dev

RUN docker-php-ext-install pdo pdo_sqlite zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY ./laravel /app

COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf

RUN mkdir -p /var/log/nginx /var/log/supervisor /app/storage/app/public

RUN touch /app/database/database.sqlite && \
    chown -R www-data:www-data /app/storage /app/bootstrap/cache /app/database && \
    chmod -R 775 /app/storage /app/bootstrap/cache && \
    chmod 664 /app/database/database.sqlite

RUN ln -sf /app/storage/app/public /app/public/storage

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN php artisan config:clear && php artisan cache:clear

EXPOSE 80

CMD ["sh", "-c", "chown -R www-data:www-data /app/storage /app/database && chmod -R 775 /app/storage && chmod 664 /app/database/database.sqlite && ln -sf /app/storage/app/public /app/public/storage && mkdir -p /app/storage/app/public/avatars /app/storage/app/public/items /app/storage/app/public/drops && /usr/bin/supervisord -c /etc/supervisord.conf"]
