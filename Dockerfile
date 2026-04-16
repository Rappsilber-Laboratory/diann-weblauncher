FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dotnet-base
# This stage provides .NET SDK 8.0

FROM node:20-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    curl \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install .NET SDK 8.0 (using the official Microsoft script or copying from dotnet stage)
COPY --from=dotnet-base /usr/share/dotnet /usr/share/dotnet
RUN ln -s /usr/share/dotnet/dotnet /usr/bin/dotnet

# Download and Unpack DIA-NN
RUN mkdir -p /opt/diann && \
    wget https://github.com/vdemichev/DiaNN/releases/download/2.0/DIA-NN-2.5.0-Academia-Linux.zip -O /tmp/diann.zip && \
    unzip /tmp/diann.zip -d /opt/diann && \
    rm /tmp/diann.zip && \
    chmod +x /opt/diann/diann-* 2>/dev/null || true

# Add diaNN to PATH
ENV PATH="/opt/diann:/app/bin:${PATH}"

RUN mkdir -p /jobs /data

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/app ./app

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
