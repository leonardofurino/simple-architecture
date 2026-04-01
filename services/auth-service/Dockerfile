FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY services/commons/package*.json ./services/commons/
COPY services/auth-service/package*.json ./services/auth-service/

RUN npm install

COPY services/commons ./services/commons
COPY services/auth-service ./services/auth-service

RUN cd services/commons && npm run build
RUN cd services/auth-service && npm run build

WORKDIR /usr/src/app/services/auth-service

EXPOSE 3001

CMD ["npm", "start"]