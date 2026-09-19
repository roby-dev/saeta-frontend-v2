# syntax = docker/dockerfile:1
ARG NODE_VERSION=22-alpine
FROM node:${NODE_VERSION} AS build

LABEL project="saeta-frontend-v2"

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Unprivileged Nginx runtime matching asia-novedades
FROM nginxinc/nginx-unprivileged:1.29-alpine

COPY --from=build --chown=nginx:nginx /app/dist/saeta-frontend-v2/browser /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf.template /etc/nginx/nginx.conf.template
COPY --chown=nginx:nginx --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh

USER nginx
EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
