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

# Copy custom nginx configuration
# We will create this file next
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
# Vite builds to 'dist' by default
COPY --from=builder /app/dist /usr/share/nginx/html/

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
