# Star Wars RPG Character Manager - Production Dockerfile
# Optimized for Mac M4 (ARM64) architecture

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
COPY run_web.py .
COPY startup.py .
COPY create_admin_user.py .

# Create necessary directories
RUN mkdir -p /app/logs

# Set environment variables for production
ENV PYTHONPATH=/app/src
ENV FLASK_ENV=production
ENV APP_ENV=production
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run the application with startup script
CMD ["python", "startup.py"]