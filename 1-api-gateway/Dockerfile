FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose service port
EXPOSE 3000

# Start the service
CMD ["npm", "run", "start"]