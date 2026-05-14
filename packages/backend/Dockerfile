FROM node:18-alpine

WORKDIR /app

# 1. Copy package files
COPY package*.json ./

# 2. Install dependencies
RUN npm install

# 3. Copy everything else
COPY . .

# 4. Generate Prisma and Build
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
