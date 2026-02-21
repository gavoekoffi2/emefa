FROM node:20-alpine

WORKDIR /app

COPY package.json .
RUN npm install --production

COPY . .

RUN mkdir -p sessions

EXPOSE 8095

CMD ["node", "index.js"]
