# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 设置Node.js内存限制和优化选项
ENV NODE_OPTIONS="--max-old-space-size=2048"

# 复制package文件
COPY package*.json ./

# 安装依赖（包括devDependencies，因为构建需要vite等工具）
# 使用 npm install 而不是 npm ci，因为 npm ci 要求 package-lock.json 必须与 package.json 完全匹配
# 在服务器部署场景中，npm install 更稳定可靠
RUN npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 构建参数：API基础URL
ARG API_BASE_URL=http://localhost:8000/api

# 构建应用（注入环境变量）
ENV VITE_API_BASE_URL=${API_BASE_URL}
ENV NODE_ENV=production

# 构建应用
RUN npm run build-only

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

