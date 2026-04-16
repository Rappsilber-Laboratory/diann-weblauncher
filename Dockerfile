FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app

# Install dependencies if needed for diaNN (e.g. libomp)
RUN apt-get update && apt-get install -y \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Add placeholder for diaNN or diann-wrapper
# The user likely has their own way to mount the diann binary.
# I'll create a dummy diann-wrapper for demonstration if it's missing.

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/data ./data
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/types ./types
# Copy api folder if needed, though they are in .next for build
# For safety, let's copy the code too if we want to run in dev mode or just build
COPY --from=builder /app/app ./app

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
