FROM node:24-alpine3.22

WORKDIR /server

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 8080

CMD ["node", "./bin/www"]