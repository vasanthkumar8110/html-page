# Simple Production Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files from THIS folder
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy everything from THIS folder (backend)
COPY . .

# Generate Prisma Client and build
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
