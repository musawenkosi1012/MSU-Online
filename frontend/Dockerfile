# Build stage
FROM node:24.13.0-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginxinc/nginx-unprivileged:stable-alpine-slim

# Switch to root to create the user
USER root

# Create a non-root user with a specific UID (10014 for Choreo)
RUN addgroup -g 10014 choreo && \
    adduser -u 10014 -S choreo -G choreo

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage with correct ownership
COPY --from=builder /app/dist /usr/share/nginx/html/
RUN chown -R 10014:10014 /usr/share/nginx/html/ && \
    chown -R 10014:10014 /var/cache/nginx && \
    chown -R 10014:10014 /var/log/nginx && \
    chown -R 10014:10014 /etc/nginx/conf.d

EXPOSE 8080

# Switch to the non-root user
USER 10014

CMD ["nginx", "-g", "daemon off;"]
