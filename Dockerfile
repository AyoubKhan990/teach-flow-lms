# Stage 1: Build the Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Setup Backend and Serve
FROM node:20-slim

# Install Python and pip (Required for transcript service)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server

# Copy backend dependencies first for caching
COPY server/package*.json ./
RUN npm ci --omit=dev

# Install Python dependencies
# We use --break-system-packages because we are in a container environment
RUN pip3 install youtube-transcript-api requests --break-system-packages

# Copy backend source code
COPY server/ .

# Copy built frontend assets from Stage 1
# server.js is configured to serve ../frontend/dist when NODE_ENV=production
COPY --from=frontend-builder /app/frontend/dist ../frontend/dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Expose port
EXPOSE 8000

# Start the server
CMD ["node", "server.js"]
