# 快速部署指南

## 使用Docker一键部署（推荐）

### 1. 准备环境

确保已安装：
- Docker 20.10+
- Docker Compose 2.0+

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，修改必要的配置
# 特别注意：修改SECRET_KEY和数据库密码
```

### 3. 启动服务

```bash
# 启动所有服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 初始化数据库

```bash
# 运行数据库迁移
docker-compose exec backend python manage.py migrate

# 创建超级用户（可选）
docker-compose exec backend python manage.py createsuperuser
```

### 5. 访问服务

- **前端管理后台**: http://localhost:3000
- **后端API**: http://localhost:8000/api
- **API文档**: http://localhost:8000/api/schema/swagger-ui/

## 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

## 更新部署

```bash
# 拉取最新代码
git pull

# 重建并重启服务
docker-compose up -d --build

# 运行数据库迁移（如果有）
docker-compose exec backend python manage.py migrate
```

## 常见问题

### 端口被占用

修改 `.env` 文件中的端口配置：
- `BACKEND_PORT`: 后端端口（默认8000）
- `FRONTEND_PORT`: 前端端口（默认3000）
- `MYSQL_PORT`: MySQL端口（默认13306）
- `REDIS_PORT`: Redis端口（默认16379）

### 数据库连接失败

1. 检查MySQL容器是否正常运行：`docker-compose ps`
2. 检查环境变量配置是否正确
3. 查看后端日志：`docker-compose logs backend`

### 前端无法访问后端API

1. 检查后端服务是否正常运行
2. 确认API_BASE_URL配置正确
3. 检查CORS配置

## 详细文档

更多详细信息请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

