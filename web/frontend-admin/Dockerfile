# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 设置Node.js内存限制和优化选项
ENV NODE_OPTIONS="--max-old-space-size=3072 --no-warnings"
ENV NODE_ENV=production

# 复制package文件
COPY package*.json ./

# 安装依赖（使用npm install而不是npm ci，更稳定）
RUN npm install --legacy-peer-deps --prefer-offline --no-audit

# 复制源代码
COPY . .

# 构建参数：API基础URL
ARG API_BASE_URL=http://localhost:8000/api

# 构建应用（注入环境变量）
ENV VITE_API_BASE_URL=${API_BASE_URL}

# 构建应用（跳过type-check以加快构建速度）
RUN npm run build-only -- --mode production

# 生产阶段
FROM nginx:alpine

# 复制构建产物到nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]

