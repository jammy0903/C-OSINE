# C-OSINE Frontend
# Multi-stage: Build with Node, Serve with Nginx

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 먼저 (캐시 활용)
COPY package*.json ./
RUN npm ci

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Nginx 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
