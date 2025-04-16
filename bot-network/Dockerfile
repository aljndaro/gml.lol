FROM node:18-alpine

RUN mkdir /opt/bot
COPY . /opt/bot
WORKDIR /opt/bot

COPY . /opt/bot

# Install make and other dependencies
RUN apk update \
    && apk add --virtual build-dependencies \
        build-base \
        gcc \
        wget \
        git \
    && npm install -g yarn --force 


RUN yarn install
RUN yarn tsc

CMD ["node", "/opt/bot/dist/index.js"]