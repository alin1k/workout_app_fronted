# syntax=docker/dockerfile:1

# Build stage: install deps and produce dist/ from the Vite build.
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Export stage: a tiny scratch image whose only contents are the built dist/.
# Use `docker build --target dist --output type=local,dest=./dist .` to
# extract the dist folder straight to the host without running a container.
FROM scratch AS dist
COPY --from=builder /app/dist /
