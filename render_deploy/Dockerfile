FROM python:3.11-slim

# Install system dependencies (Redis, Nginx, curl, gettext-base for envsubst)
RUN apt-get update && apt-get install -y \
    curl \
    redis-server \
    nginx \
    gettext-base \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy configuration files
COPY render_deploy/ /app/render_deploy/

# Copy and build frontend
COPY frontend/ /app/frontend/
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Copy and install backend requirements
WORKDIR /app
COPY backend/ /app/backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Create necessary directories and set permissions
RUN mkdir -p /app/backend/media /app/backend/static /app/backend/db && \
    chmod -R 777 /app /tmp /var/log/nginx /var/lib/nginx

# Make the start script executable
RUN chmod +x /app/render_deploy/start.sh

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=drishtirakshak.settings
ENV REDIS_URL=redis://127.0.0.1:6379/0
ENV DEBUG=True
ENV SECRET_KEY=django-insecure-render-deployment-secret-key-12345
ENV ALLOWED_HOSTS=*
ENV CORS_ALLOWED_ORIGINS=http://localhost:10000,http://127.0.0.1:10000

# Run collectstatic at build time
WORKDIR /app/backend
RUN python manage.py collectstatic --noinput

# Set entrypoint to our startup script
ENTRYPOINT ["/bin/bash", "/app/render_deploy/start.sh"]
