# Star Wars RPG Character Manager - Production Dockerfile
# Multi-architecture support for Unraid (x86_64 and ARM64)

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    gosu \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY src/ ./src/
COPY web/ ./web/
COPY run_web.py .
COPY startup.py .
COPY startup_production.py .
COPY startup_ci.py .
COPY tools/ ./tools/

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/data \
    && chmod 755 /app/logs /app/data

# Create entrypoint script for Unraid compatibility
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set environment variables for production
ENV PYTHONPATH=/app/src
ENV FLASK_ENV=production
ENV APP_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PUID=99
ENV PGID=100

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Use entrypoint script for proper permission handling
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["python", "-c", "print('🔥 DOCKERFILE DEBUG: About to run startup_production.py'); exec(open('startup_production.py').read())"]