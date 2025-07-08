# Star Wars RPG Character Manager - Production Dockerfile
# Optimized for production deployment with Gunicorn

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY src/ ./src/
COPY web/ ./web/
COPY swrpg_extracted_data/ ./swrpg_extracted_data/
COPY startup_production.py .

# Create encryption key at runtime if it doesn't exist
# (Security keys should not be committed to git)

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/data \
    && chmod 755 /app/logs /app/data

# Set environment variables for production
ENV PYTHONPATH=/app/src
ENV FLASK_ENV=production
ENV APP_ENV=production
ENV PYTHONUNBUFFERED=1
ENV GUNICORN_WORKERS=4

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application with production startup script
CMD ["python", "startup_production.py"]