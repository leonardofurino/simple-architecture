FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY services/commons/package*.json ./services/commons/
COPY services/webserver/package*.json ./services/webserver/

RUN npm install

COPY services/commons ./services/commons
COPY services/webserver ./services/webserver

RUN cd services/commons && npm run build
RUN cd services/webserver && npm run build

WORKDIR /usr/src/app/services/webserver

EXPOSE 3003

CMD ["npm", "start"]