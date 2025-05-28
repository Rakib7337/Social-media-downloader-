# Use Node.js as the base image
FROM node:20-alpine

# Set working directory
WORKPACE /app

# Install dependencies for yt-dlp
RUN apk add --no-cache python3 ffmpeg

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Run the script to install yt-dlp
RUN npm run install-yt-dlp

# Build the application
RUN npm run build

# Expose ports for both frontend and backend
EXPOSE 5173 3001

# Start both servers
CMD ["npm", "run", "dev:full"]
