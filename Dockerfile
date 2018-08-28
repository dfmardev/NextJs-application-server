FROM node:stretch

RUN mkdir ~/.ssh
COPY id_rsa_adapters ~/.ssh/
RUN ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts
ADD dockersshconfig ~/.ssh/config
RUN eval "$(ssh-agent -s)"
RUN ssh-add ~/.ssh/id_rsa_adapters

ARG MACHINENAME=application-server
ENV MACHINENAME=${MACHINENAME}

RUN mkdir -p /usr/src
RUN mkdir -p /usr/src/certs

WORKDIR /usr/src

# Setup ffmpeg to handle video rendering.
RUN apt-get update
RUN apt-get install ffmpeg -y

RUN npm install pm2 -g

# Bundle app source
COPY . /usr/src/

RUN npm install
RUN npm run build

EXPOSE 3000
EXPOSE 3001

CMD pm2-docker --public gz4rkzmirzdlp2r --secret 9761q3vfr9xyfih process.json --machine-name $MACHINENAME
