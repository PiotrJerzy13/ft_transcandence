# ./frontend/Dockerfile
FROM node:18-alpine

# Create a non-root user with a different UID
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 5173

CMD ["npm", "run", "dev"]
