FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Install all dependencies (including dev) to build
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate prisma client
RUN npx prisma generate
# Build the application
RUN BETTER_AUTH_SECRET=dummy_secret_for_build_step BETTER_AUTH_URL=http://localhost npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy necessary files for production
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=builder --chown=appuser:appgroup /app/server.js ./server.js

USER appuser

EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0

# Push prisma schema to db on startup and then run the server
CMD ["sh", "-c", "npx prisma db push && node server.js"]