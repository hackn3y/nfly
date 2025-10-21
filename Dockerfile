FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package.json and workspace configuration
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm install --workspace=packages/backend --omit=dev

# Copy backend source code
COPY packages/backend ./packages/backend

# Set working directory to backend
WORKDIR /app/packages/backend

# Expose port
EXPOSE 4100

# Run migrations then start server
CMD ["npm", "run", "start:prod"]
