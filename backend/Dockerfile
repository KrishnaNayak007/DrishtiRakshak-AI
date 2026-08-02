FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first
COPY requirements.txt .

# 1. Install CPU-only PyTorch and Torchvision (with timeout extensions)
RUN pip install --no-cache-dir --default-timeout=1000 --retries 5 torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 2. Install remaining python dependencies (with timeout extensions)
RUN pip install --no-cache-dir --default-timeout=1000 --retries 5 -r requirements.txt

# Copy project files
COPY . .

EXPOSE 8000

CMD sh -c "python manage.py migrate && gunicorn drishtirakshak.wsgi:application --bind 0.0.0.0:$PORT"