FROM node:18-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies required for Sharp
RUN apk add --no-cache build-base gcc autoconf automake libtool nasm vips-dev

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Copy the prisma directory
COPY prisma ./prisma

# Install dependencies including Sharp with the correct platform
RUN npm install
RUN npm install --cpu=x64 --os=linux sharp

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure the .env file is copied for Prisma to use
COPY .env .env

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build Next.js based on the preferred package manager
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install runtime dependencies for Sharp
RUN apk add --no-cache vips-dev

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]