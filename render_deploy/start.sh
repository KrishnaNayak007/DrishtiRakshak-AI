#!/bin/bash

# Substitute Render's dynamic $PORT into Nginx config
echo "Configuring Nginx port to $PORT..."
envsubst '${PORT}' < /app/render_deploy/nginx.conf.template > /tmp/nginx.conf

# Start local Redis server in the background (uses only ~5MB RAM)
echo "Starting Redis server..."
redis-server --port 6379 --bind 127.0.0.1 --daemonize yes

# Run Django database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Start Celery worker in the background (concurrency=1 to save memory)
echo "Starting Celery worker..."
celery -A drishtirakshak worker --loglevel=info --concurrency=1 &

# Start Nginx in the background
echo "Starting Nginx reverse proxy..."
nginx -c /tmp/nginx.conf -g "daemon off;" &

# Start Django Web API server (Gunicorn binds to local port 8000)
echo "Starting Django Web Server on port 8000..."
exec gunicorn drishtirakshak.wsgi:application --bind 127.0.0.1:8000 --workers 1 --threads 2 --timeout 120
