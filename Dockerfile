FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# Make sure to install sqlite3 successfully on Alpine
RUN apk add --no-cache python3 make g++ && npm install --production

# Copy the rest of the application
COPY sequencer/ ./sequencer/
COPY data/ ./data/

# Expose Sequencer Port
EXPOSE 4243

# Start the Node.js Sequencer Server
CMD ["node", "sequencer/server.js"]
