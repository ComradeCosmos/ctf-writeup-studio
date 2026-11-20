# Multi-stage Dockerfile for CTF Writeup Studio
# Works on any Linux distro, macOS, Windows Docker Desktop, or cloud environment

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --silent || npm install --silent

COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime Backend + Static Serve
FROM python:3.11-slim AS runtime
WORKDIR /app

# Install system security & network audit tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    nmap \
    iputils-ping \
    dnsutils \
    tar \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV HOST=0.0.0.0
ENV PORT=8000
ENV PYTHONPATH=/app/backend

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
