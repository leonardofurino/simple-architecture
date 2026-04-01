FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY services/commons/package*.json ./services/commons/
COPY services/notification/package*.json ./services/notification/

RUN npm install

COPY services/commons ./services/commons
COPY services/notification ./services/notification

RUN cd services/commons && npm run build
RUN cd services/notification && npm run build

WORKDIR /usr/src/app/services/notification

EXPOSE 3002

CMD ["npm", "start"]