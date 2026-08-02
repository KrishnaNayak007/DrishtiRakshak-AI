FROM python:3.11-slim

# Install system dependencies (Redis, Nginx, curl, supervisor, Node.js)
RUN apt-get update && apt-get install -y \
    curl \
    redis-server \
    nginx \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Qdrant binary
RUN curl -L -o qdrant.tar.gz https://github.com/qdrant/qdrant/releases/download/v1.7.4/qdrant-x86_64-unknown-linux-gnu.tar.gz && \
    tar -xzf qdrant.tar.gz && \
    mv qdrant /usr/local/bin/qdrant && \
    chmod +x /usr/local/bin/qdrant && \
    rm qdrant.tar.gz

WORKDIR /app

# Copy configuration files
COPY hf_deploy/ /app/hf_deploy/

# Copy and build frontend
COPY frontend/ /app/frontend/
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Copy and install backend requirements
WORKDIR /app
COPY backend/ /app/backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Create necessary directories and set permissions for UID 1000
RUN mkdir -p /app/qdrant_data /app/backend/media /app/backend/static /app/backend/db && \
    chmod -R 777 /app /tmp /var/log/nginx /var/lib/nginx

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=drishtirakshak.settings
ENV DATABASE_URL=sqlite:////app/backend/db/db.sqlite3
ENV REDIS_URL=redis://127.0.0.1:6379/0
ENV QDRANT_HOST=127.0.0.1
ENV QDRANT_PORT=6333
ENV DEBUG=True
ENV SECRET_KEY=django-insecure-huggingface-spaces-deployment-secret-key-12345
ENV ALLOWED_HOSTS=*
ENV CORS_ALLOWED_ORIGINS=http://localhost:7860,http://127.0.0.1:7860

# Run migrations and collect static files
WORKDIR /app/backend
RUN python manage.py migrate && \
    python manage.py collectstatic --noinput

# Port required by Hugging Face Spaces
EXPOSE 7860

# Start supervisord to launch all services
CMD ["supervisord", "-c", "/app/hf_deploy/supervisord.conf"]
