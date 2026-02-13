# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Create a non-root user with a specific UID (10014 for Choreo)
RUN addgroup --gid 10014 choreo && \
    adduser --uid 10014 --gid 10014 --disabled-password --gecos "" choreo

# Set directory
WORKDIR /app

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R 10014:10014 /app/data

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY --chown=choreo:choreo requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application with correct ownership
COPY --chown=choreo:choreo . .

# Expose port
EXPOSE 8080

# Switch to the non-root user
USER 10014

# Run the application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
