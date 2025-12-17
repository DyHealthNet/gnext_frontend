# Stage 1: Build with Vite
FROM node:20-alpine AS build

# Accept build arg for which env file to use
ARG ENV_FILE=.env

WORKDIR /app

# Copy the specified .env file to parent of WORKDIR so vite.config.js can find it at '../.env'
# Since WORKDIR is /app, put .env at root /
COPY ${ENV_FILE} /.env

COPY gnext_frontend/package*.json ./
RUN npm ci

COPY gnext_frontend/ .
RUN npm run build

# Stage 2: Serve with Nginx + reverse proxy
FROM nginx:1.27-alpine

# Serve built SPA
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx template -> rendered at container start with envsubst
# Make sure this file exists in your repo
COPY gnext_frontend/nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Tell the official entrypoint to render *.template into /etc/nginx/conf.d/
ENV NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx/templates \
    NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d \
    NGINX_ENVSUBST_TEMPLATE_SUFFIX=.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
