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

# Production runtime with Nginx
FROM nginx:alpine AS runtime

ENV PORT=80
ENV NGINX_ENVSUBST_FILTER="PORT"

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/saeta-frontend-v2/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
