# ==========================================
# Stage 1: Build the application
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the self-contained Nitro server for Node.js
ENV NITRO_PRESET=node-server
RUN npm run build

# ==========================================
# Stage 2: Run the application
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy compiled standalone output from builder stage
COPY --from=builder /app/.output ./.output

# Use non-root node user provided by the base alpine image
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Docker Healthcheck utilizing alpine's built-in wget
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
