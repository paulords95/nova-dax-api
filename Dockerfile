FROM node:12

WORKDIR /home

COPY package*.json /home/

RUN npm install

COPY . /home

EXPOSE 9433

CMD ["node", "index.js"]