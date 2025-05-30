# Use Node.js as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for yt-dlp and build tools
RUN apk add --no-cache python3 ffmpeg

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install npm dependencies (faster and more reliable in CI)
RUN npm ci

# Copy the rest of your application code
COPY . .

# Install yt-dlp via npm script
RUN npm run install-yt-dlp

# Build the application
RUN npm run build

# Expose frontend and backend ports
EXPOSE 5173 3001

# Start both servers
CMD ["npm", "run", "dev:full"]
