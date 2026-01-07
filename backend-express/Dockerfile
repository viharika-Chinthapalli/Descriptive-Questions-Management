FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create data directory for JSON storage
RUN mkdir -p data

# Expose port
EXPOSE 8000

# Start the application
CMD ["node", "server.js"]

