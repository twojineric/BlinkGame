FROM node:12-alpine AS build
WORKDIR /srv
ADD package.json .
RUN npm install
ADD . .

FROM node:12-alpine
COPY --from=build /srv .
EXPOSE 8080
CMD ["node", "server/server.js"]
