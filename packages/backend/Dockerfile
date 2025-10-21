FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 4100

# Run migrations then start server
CMD ["npm", "run", "start:prod"]
