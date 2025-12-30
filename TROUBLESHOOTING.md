# 前端构建卡住问题解决方案

## 问题描述

在构建前端Docker镜像时，`npm run build-only` 命令在 `vite build` 的 `transforming...` 阶段卡住不动。

## 原因分析

1. **内存不足**：2核4G服务器，同时运行MySQL、Redis、后端服务，剩余内存可能不足
2. **Node.js内存限制**：默认内存限制可能不够
3. **构建优化不足**：Vite构建大型Vue项目需要较多资源
4. **依赖安装问题**：npm ci可能在某些情况下不稳定

## 解决方案

### 方案1：优化后的Dockerfile（已更新）

已更新 `web/frontend-admin/Dockerfile`，主要改进：
- 增加Node.js内存限制到3GB
- 使用 `npm install` 替代 `npm ci`（更稳定）
- 添加构建优化选项

### 方案2：临时停止其他服务（推荐）

在构建前端时，临时停止其他服务以释放内存：

```bash
# 停止其他服务
docker compose stop backend mysql redis

# 构建前端
docker compose build --no-cache frontend

# 重新启动所有服务
docker compose up -d
```

### 方案3：增加服务器交换空间（Swap）

如果内存确实不足，可以增加交换空间：

```bash
# 创建2GB交换文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用（可选）
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 验证
free -h
```

### 方案4：本地构建后上传（最快）

如果服务器资源确实不足，可以在本地构建后上传：

**在本地电脑执行：**

```bash
# 进入前端目录
cd web/frontend-admin

# 安装依赖
npm install

# 构建（使用你的服务器IP）
VITE_API_BASE_URL=http://你的服务器IP:8000/api npm run build

# 上传dist目录到服务器
scp -r dist root@你的服务器IP:/root/smart-community-platform/web/frontend-admin/
```

**在服务器上修改Dockerfile为简化版本：**

```dockerfile
FROM nginx:alpine

# 复制构建产物
COPY dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 方案5：使用多阶段构建优化

如果还是卡住，可以尝试分步构建：

```bash
# 1. 先只安装依赖
docker build --target builder -t frontend-builder:latest \
  --build-arg API_BASE_URL=http://你的服务器IP:8000/api \
  -f web/frontend-admin/Dockerfile \
  web/frontend-admin/

# 2. 进入容器手动构建
docker run -it --rm frontend-builder:latest sh
# 在容器内执行：npm run build-only

# 3. 或者直接使用docker compose
docker compose build frontend
```

## 检查步骤

### 1. 检查内存使用

```bash
# 查看当前内存使用
free -h

# 查看Docker容器资源使用
docker stats

# 如果内存使用超过80%，需要优化
```

### 2. 检查构建日志

```bash
# 查看详细构建日志
docker compose build --progress=plain frontend

# 或者进入构建容器查看
docker compose run --rm frontend sh
```

### 3. 检查是否有大文件

```bash
# 检查前端目录大小
du -sh web/frontend-admin/*

# 检查node_modules大小
du -sh web/frontend-admin/node_modules
```

## 推荐操作流程

1. **首先尝试方案2**（停止其他服务构建）：
   ```bash
   docker compose stop backend mysql redis
   docker compose build --no-cache frontend
   docker compose up -d
   ```

2. **如果还是卡住，尝试方案4**（本地构建上传）

3. **长期解决**：考虑升级服务器到4核8G，或使用方案3增加交换空间

## 验证构建成功

构建成功后，应该看到：

```
=> [builder 6/6] RUN npm run build-only
=> => # ✓ built in XXs
=> [stage-1 2/3] COPY --from=builder /app/dist /usr/share/nginx/html
```

然后可以启动服务：

```bash
docker compose up -d frontend
docker compose ps frontend
```

## 如果问题依然存在

请提供以下信息以便进一步诊断：

1. 服务器内存使用情况：`free -h`
2. Docker容器资源使用：`docker stats`
3. 完整的构建日志（至少最后50行）
4. 是否有错误信息

