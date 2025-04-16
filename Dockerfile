# Use Debian instead of Alpine for better native support
FROM node:18-slim AS base

# Install build dependencies needed for sharp
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    autoconf \
    automake \
    libtool \
    nasm \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only package.json and lock file to install deps first
COPY package.json package-lock.json* ./

# Install deps (this will install sharp correctly on linux-x64)
RUN npm ci --include=optional

# Copy all project files
COPY . .

# Copy .env early if needed for prisma
COPY .env .env

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Clean up dev dependencies (optional)
RUN npm prune --production

# Start in production mode
EXPOSE 3001
ENV NODE_ENV production
ENV HOSTNAME 0.0.0.0
ENV PORT 3001

CMD ["node", "server.js"]
