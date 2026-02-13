# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Set user DB to /data for persistence if volume is mounted, else local
# Create a directory for the app
WORKDIR /app

# Install system dependencies (build-essential for compiling some python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
# Remove problematic packages for lightweight cloud deployment if necessary
# For now, we install everything. If Choreo fails on 'llama-cpp-python' without GPU, 
# we might need to use a specific wheel or just rely on Mock mode without installing it.
# However, requirements.txt has it. Let's try to install.
# Note: llama-cpp-python often needs 'CMAKE_ARGS="-DGGML_BLAS=ON -DGGML_OPENBLAS=ON"' etc for better perf, 
# but for basic CPU install, pip install is usually fine.
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port (Choreo usually expects 8080 or configures it)
EXPOSE 8080

# Create a non-root user with a specific UID (10014 is common for Choreo)
RUN addgroup --gid 10014 choreo && \
    adduser --uid 10014 --gid 10014 --disabled-password --gecos "" choreo

# Set ownership of the application directory to the non-root user
RUN chown -R choreo:choreo /app

# Switch to the non-root user
USER 10014

# Run the application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
