FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json .

RUN npm install

COPY src ./src

# Debug: List files before build
RUN ls -la src/

# Build and verify
RUN npm run build && ls -la dist/

EXPOSE 3000

CMD ["node", "dist/server.mjs"]
