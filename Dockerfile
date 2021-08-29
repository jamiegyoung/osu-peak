FROM node:16.8

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

COPY . .

RUN npm install --silent && npm run build

CMD ["npm", "start"]
