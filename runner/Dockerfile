FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dotnet-base

FROM node:20-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    curl \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install .NET SDK 8.0
COPY --from=dotnet-base /usr/share/dotnet /usr/share/dotnet
RUN ln -s /usr/share/dotnet/dotnet /usr/bin/dotnet

# Download and Unpack DIA-NN
RUN mkdir -p /opt/diann && \
    wget https://github.com/vdemichev/DiaNN/releases/download/2.0/DIA-NN-2.5.0-Academia-Linux.zip -O /tmp/diann.zip && \
    unzip /tmp/diann.zip -d /opt/diann && \
    rm /tmp/diann.zip && \
    find /opt/diann -name "diann-linux" -exec chmod +x {} + && \
    ln -s $(find /opt/diann -name "diann-linux" | head -n 1) /usr/local/bin/diann

# Add diaNN to PATH
ENV PATH="/opt/diann:/app/bin:${PATH}"

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
