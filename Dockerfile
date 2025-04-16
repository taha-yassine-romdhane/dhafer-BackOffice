# 1️⃣ Base image with Debian (NOT Alpine!)
FROM node:18-slim AS base

# 2️⃣ Install build dependencies (for Sharp and others)
FROM base AS deps
WORKDIR /app

# Install system packages
RUN apt-get update && apt-get install -y \
  build-essential \
  gcc \
  autoconf \
  automake \
  libtool \
  nasm \
  libvips-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Copy Prisma directory
COPY prisma ./prisma

# Install node dependencies
RUN npm install

# 3️⃣ Build the app
FROM base AS builder
WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all app source code
COPY . .

# Copy .env for Prisma
COPY .env .env

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build Next.js app
RUN npm run build

# 4️⃣ Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install runtime dependency for Sharp
RUN apt-get update && apt-get install -y libvips-dev && rm -rf /var/lib/apt/lists/*

# Add system user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set permissions for .next
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Start the app
CMD ["node", "server.js"]
