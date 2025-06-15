# NOTE: This base image (node:20-alpine3.19) may show high vulnerability warnings in VS Code.
# These are related to known CVEs in Alpine packages and do not always pose a direct threat.
FROM node:20-alpine3.19

# Update package index and install SQLite and build dependencies
RUN apk update && apk upgrade && apk add --no-cache sqlite python3 make g++ libc6-compat

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Create directory for SQLite database
RUN mkdir -p /app/data

# Debug: List files before build
RUN ls -la src/

# Build TypeScript code
RUN npm run build && ls -la dist/

# Expose port for API
EXPOSE 3000

# Command to run app
CMD ["node", "dist/server.mjs"]
