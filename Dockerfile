# Stage 1: Build with Vite
FROM node:20-alpine AS build
WORKDIR /app

# Copy root .env into the build context so Vite picks it up
COPY .env .env

# Copy only package.json and lockfile first for caching
COPY dyhealthnetlight_frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source
COPY dyhealthnetlight_frontend/ .

# Build the app (Vite will read from .env)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
