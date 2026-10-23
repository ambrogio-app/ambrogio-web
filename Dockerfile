# Build stage: runs on the native build platform, the output is platform independent.
# BuildKit sets BUILDPLATFORM; the classic builder needs --build-arg BUILDPLATFORM=linux/<arch>.
ARG BUILDPLATFORM
FROM --platform=$BUILDPLATFORM node:24 AS build
WORKDIR /app
RUN npm install --global pnpm@12.11.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
RUN pnpm build

# Runtime stage: static files served by an unprivileged nginx on port 8080.
FROM nginxinc/nginx-unprivileged:1.30-alpine
LABEL org.opencontainers.image.source="https://github.com/ambrogio-app/ambrogio-web" \
      org.opencontainers.image.licenses="MIT"
USER root
RUN rm -rf /usr/share/nginx/html/*
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER 101
EXPOSE 8080
