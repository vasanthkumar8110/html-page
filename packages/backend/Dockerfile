FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Provide a dummy DATABASE_URL for the build phase
RUN DATABASE_URL="postgresql://localhost:5432" npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
