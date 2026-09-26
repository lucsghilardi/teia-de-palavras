# Imagem de desenvolvimento do backend (php-cli + `artisan serve`). A mesma
# imagem roda os serviços backend, queue, scheduler e reverb do compose.
FROM php:8.3-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libzip-dev \
    libpq-dev \
    && docker-php-ext-install -j"$(nproc)" zip pdo pdo_pgsql pcntl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY php/uploads.ini /usr/local/etc/php/conf.d/99-uploads.ini

WORKDIR /var/www
