FROM node:16-alpine as base

WORKDIR /home

COPY package*.json package-lock.json ./


FROM base as test
RUN npm install
COPY . .
EXPOSE 5000
ENV NODE_ENV=test
RUN npm run test

FROM base as build
RUN npm install
COPY . .
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "app.js"]