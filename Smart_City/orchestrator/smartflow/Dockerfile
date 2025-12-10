# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json .
COPY src ./src
COPY contracts ./contracts
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/contracts ./contracts
COPY .env.example .env.example
EXPOSE 7000
CMD ["node","dist/index.js"]
