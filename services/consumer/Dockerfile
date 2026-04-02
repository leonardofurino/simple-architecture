FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY services/commons/package*.json ./services/commons/
COPY services/consumer/package*.json ./services/consumer/

RUN npm install

COPY services/commons ./services/commons
COPY services/consumer ./services/consumer

RUN cd services/commons && npm run build
RUN cd services/consumer && npm run build

WORKDIR /usr/src/app/services/consumer

EXPOSE 3002

CMD ["npm", "start"]