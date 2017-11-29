FROM node:boron

WORKDIR /root

COPY node-crawler ./node-crawler

WORKDIR /root/node-crawler
RUN npm install

CMD [ "npm", "start" ]