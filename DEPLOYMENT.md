# 智能社区平台部署指南

本文档介绍如何部署智能社区平台的前后端服务。

## 项目结构

- **后端**: Django REST Framework (Python)
- **前端**: Vue 3 + Vite + Vuetify
- **数据库**: MySQL 8.0
- **缓存**: Redis 7.2
- **小程序**: 微信小程序（需要微信开发者工具）

## 前置要求

1. **Docker** 和 **Docker Compose** 已安装
   - Docker: 20.10+
   - Docker Compose: 2.0+

2. **Node.js** (仅用于本地开发，生产环境使用Docker)
   - Node.js: 18+

3. **Python** (仅用于本地开发，生产环境使用Docker)
   - Python: 3.11+

## 快速开始（Docker部署）

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd smart-community-platform
```

### 2. 配置环境变量

复制环境变量模板文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下关键参数：

```env
# MySQL配置
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=smart_community_db
MYSQL_PORT=13306

# Redis配置
REDIS_PORT=16379

# Django配置
DJANGO_SECRET_KEY=your-secret-key-here  # 请使用强密码
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# 后端端口
BACKEND_PORT=8000

# 前端端口
FRONTEND_PORT=3000

# API基础URL（前端使用）
API_BASE_URL=http://localhost:8000/api

# 微信小程序配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
```

### 3. 启动服务

使用 Docker Compose 一键启动所有服务：

```bash
docker-compose up -d
```

这将启动以下服务：
- MySQL数据库 (端口: 13306)
- Redis缓存 (端口: 16379)
- Django后端 (端口: 8000)
- Vue前端 (端口: 3000)

### 4. 初始化数据库

首次部署需要运行数据库迁移：

```bash
docker-compose exec backend python manage.py migrate
```

创建超级用户（可选）：

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 5. 访问服务

- **前端管理后台**: http://localhost:3000
- **后端API**: http://localhost:8000/api
- **API文档**: http://localhost:8000/api/schema/swagger-ui/

## 本地开发部署

### 后端开发

1. **安装Python依赖**

```bash
cd backend
pip install -r requirements.txt
```

2. **配置数据库**

确保MySQL和Redis服务已启动（可以使用docker-compose-environment.yml）：

```bash
docker-compose -f backend/docker-compose-environment.yml up -d
```

3. **配置环境变量**

创建 `backend/.env` 文件：

```env
DB_HOST=127.0.0.1
DB_PORT=13306
DB_NAME=smart_community_db
DB_USER=root
DB_PASSWORD=123456
REDIS_HOST=127.0.0.1
REDIS_PORT=16379
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

4. **运行迁移**

```bash
python manage.py migrate
```

5. **启动开发服务器**

```bash
python manage.py runserver
```

后端将在 http://localhost:8000 运行

### 前端开发

1. **安装依赖**

```bash
cd web/frontend-admin
npm install
```

2. **配置API地址**

编辑 `web/frontend-admin/src/services/api.ts`，修改 `API_BASE_URL`：

```typescript
const API_BASE_URL = 'http://127.0.0.1:8000/api'
```

3. **启动开发服务器**

```bash
npm run dev
```

前端将在 http://localhost:3000 运行

## 生产环境部署

### 1. 安全配置

**重要**: 在生产环境部署前，请确保：

1. 修改 `SECRET_KEY` 为强随机字符串
2. 设置 `DEBUG=False`
3. 配置正确的 `ALLOWED_HOSTS`
4. 使用HTTPS（配置反向代理如Nginx）
5. 修改数据库密码
6. 配置防火墙规则

### 2. 使用Nginx反向代理（推荐）

创建 `nginx.conf`:

```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 媒体文件
    location /media {
        proxy_pass http://backend;
    }
}
```

### 3. 数据备份

定期备份MySQL数据：

```bash
docker-compose exec mysql mysqldump -u root -p smart_community_db > backup.sql
```

恢复数据：

```bash
docker-compose exec -T mysql mysql -u root -p smart_community_db < backup.sql
```

## 常用命令

### Docker Compose命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend

# 重启服务
docker-compose restart backend

# 重建镜像
docker-compose build --no-cache

# 进入容器
docker-compose exec backend bash
```

### Django管理命令

```bash
# 数据库迁移
docker-compose exec backend python manage.py migrate

# 创建超级用户
docker-compose exec backend python manage.py createsuperuser

# 收集静态文件
docker-compose exec backend python manage.py collectstatic

# Django shell
docker-compose exec backend python manage.py shell
```

## 故障排查

### 1. 后端无法连接数据库

检查：
- MySQL容器是否正常运行: `docker-compose ps`
- 数据库连接配置是否正确
- 网络连接是否正常: `docker-compose exec backend ping mysql`

### 2. 前端无法访问后端API

检查：
- 后端服务是否正常运行
- CORS配置是否正确
- API_BASE_URL配置是否正确
- 网络连接是否正常

### 3. 静态文件404错误

运行：
```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

### 4. 端口冲突

修改 `docker-compose.yml` 中的端口映射，或修改 `.env` 文件中的端口配置。

## 小程序部署

小程序需要单独部署：

1. 使用微信开发者工具打开 `app/miniprogram` 目录
2. 配置小程序AppID和AppSecret
3. 修改API地址为生产环境后端地址
4. 上传代码并提交审核

## 监控和维护

### 健康检查

所有服务都配置了健康检查，可以通过以下命令查看：

```bash
docker-compose ps
```

### 日志管理

日志存储在Docker容器中，建议配置日志轮转：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 技术支持

如遇到问题，请检查：
1. Docker和Docker Compose版本
2. 系统资源（内存、磁盘空间）
3. 网络连接
4. 日志文件

## 更新部署

更新代码后：

```bash
# 拉取最新代码
git pull

# 重建并重启服务
docker-compose up -d --build

# 运行数据库迁移（如果有）
docker-compose exec backend python manage.py migrate
```

