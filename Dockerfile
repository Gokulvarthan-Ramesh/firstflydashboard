# Use Node.js 20-alpine for a small, secure image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application (running setup-db first to ensure tables exist)
CMD ["sh", "-c", "npm run setup-db && npm start"]
