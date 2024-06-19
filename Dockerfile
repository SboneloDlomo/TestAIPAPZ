# Base image
FROM --platform=linux/amd64 node:20

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm ci --legacy-peer-deps

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN npm run build

# COPY ./src/config/env/dev.env /usr/src/app/dev.env

EXPOSE 80
# Start the server using the production build
CMD [ "node", "dist/main.js" ]
