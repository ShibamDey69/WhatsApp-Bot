# Use the latest Ubuntu image
FROM ubuntu:latest

# Install dependencies
RUN apt-get update && \
    apt-get install -y curl ffmpeg build-essential python3 && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js LTS (using NodeSource)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs

# Install canvas dependencies
RUN apt-get update && \
    apt-get install -y libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev librsvg2-dev

# Install pm2 globally
RUN npm install -g pm2

# Set work directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port (change if your app uses a different port)
EXPOSE 3000

# Start the app using pm2 and ecosystem.config.cjs
CMD ["pm2-runtime", "ecosystem.config.cjs"]