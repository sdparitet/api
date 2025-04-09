FROM node:20.10.0-alpine AS build

WORKDIR /app

# install dependacies
COPY package*.json ./
RUN npm install --silent

ENV NODE_ENV=production

COPY . ./

RUN npm run build


FROM node:20.10.0-alpine AS prod

WORKDIR /prod

EXPOSE 4242

COPY package*.json .
RUN npm install --silent

COPY --from=build /app/dist ./

CMD ["node", "main"]
