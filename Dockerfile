FROM node:18.2

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

COPY . .

RUN npm install --silent && npm run build

CMD ["npm", "start"]
