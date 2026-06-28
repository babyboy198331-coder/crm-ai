FROM node:20-alpine

RUN apk add --no-cache openssl libssl3

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && node src/index.js"]
