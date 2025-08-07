FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --registry=https://registry.npmjs.org/

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
