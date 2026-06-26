FROM node:22-alpine

WORKDIR /app

# Install dependencies (including devDependencies needed for build)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Remove development dependencies for a smaller, secure production image
RUN npm prune --omit=dev

# Expose port
EXPOSE 8000

# Start the server
CMD ["npm", "start"]
