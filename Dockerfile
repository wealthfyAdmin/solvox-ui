# ----------------------------
# 1. Builder Stage
# ----------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# Install full dependencies (prod + dev)
COPY package.json package-lock.json ./
RUN npm install

# Copy full source
COPY . .

# Build Next.js in standalone mode
RUN npm run build

# ----------------------------
# 2. Runner Stage
# ----------------------------
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy standalone output and minimal required files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# Copy entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 3000

# Use entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
