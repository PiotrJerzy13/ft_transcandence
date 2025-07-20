# NOTE: This base image (node:20-alpine3.19) may show high vulnerability warnings in VS Code.
# These are related to known CVEs in Alpine packages and do not always pose a direct threat.
FROM node:20-alpine3.19

# Install dependencies needed for native modules and the entrypoint script
RUN apk update && apk upgrade && apk add --no-cache sqlite python3 make g++ libc6-compat bash curl

WORKDIR /app

# Copy package files and the knex config file first for better caching
COPY package*.json ./
COPY knexfile.js ./
COPY knexfile.cjs ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build TypeScript code
RUN npm run build

# Copy and set permissions for the entrypoint script
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000

# Set the entrypoint to our script
ENTRYPOINT ["entrypoint.sh"]

# The default command to be executed by the entrypoint
CMD ["npm", "run", "start"]
