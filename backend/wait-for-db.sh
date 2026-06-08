#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."

# Ждём, пока БД не ответит
until nc -z db 5432; do
  echo "PostgreSQL is not ready yet - sleeping"
  sleep 1
done

echo "PostgreSQL is ready - starting application"

# Запускаем приложение
exec "$@"